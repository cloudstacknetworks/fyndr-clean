/**
 * Timeline Orchestration Engine (STEP 36)
 * 
 * Core service for calculating, normalizing, and executing RFP timeline automations
 * Handles Q&A windows, submission deadlines, demo scheduling, and award target dates
 */

import { RFP } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ========================================
// TypeScript Type Definitions
// ========================================

export type TimelinePhaseId =
  | "planning"
  | "invitation"
  | "q_and_a"
  | "submission"
  | "evaluation"
  | "demo"
  | "award";

export type TimelineAutomationActionId =
  | "open_q_and_a"
  | "close_q_and_a"
  | "lock_submissions"
  | "send_submission_reminder"
  | "open_demo_window"
  | "close_demo_window"
  | "send_demo_reminder"
  | "award_target_reached";

export interface RfpTimelineConfig {
  version: number;
  timezone: string; // e.g., "America/Chicago"
  keyDates: {
    invitationSentAt?: string | null;
    qaOpenAt?: string | null;
    qaCloseAt?: string | null;
    submissionDeadlineAt?: string | null;
    evaluationStartAt?: string | null;
    demoWindowStartAt?: string | null;
    demoWindowEndAt?: string | null;
    awardTargetAt?: string | null;
  };
  automation: {
    enableQaWindowAutoToggle: boolean;
    enableSubmissionAutoLock: boolean;
    enableDemoAutoWindow: boolean;
    enableAwardTargetReminder: boolean;
    reminderRules: {
      submissionReminderDaysBefore?: number | null;
      demoReminderDaysBefore?: number | null;
    };
  };
}

export interface RfpTimelineComputedPhase {
  phaseId: TimelinePhaseId;
  label: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

export interface RfpTimelineNextEvent {
  timestamp: string;
  label: string;
  actionId: TimelineAutomationActionId;
  description: string;
}

export interface RfpTimelineStateSnapshot {
  rfpId: string;
  generatedAt: string;
  currentPhase?: TimelinePhaseId | null;
  phases: RfpTimelineComputedPhase[];
  nextEvents: RfpTimelineNextEvent[];
  isQaOpen: boolean;
  isSubmissionsLocked: boolean;
  isDemoWindowOpen: boolean;
  awardTargetStatus: "not_set" | "upcoming" | "past_due" | "met";
}

// ========================================
// Helper Functions
// ========================================

/**
 * Convert Date to ISO string or return null
 */
function toIsoStringOrNull(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === "string") return date;
  return date.toISOString();
}

/**
 * Parse ISO string to Date or return null
 */
function parseIsoDate(isoString: string | null | undefined): Date | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if date A is before date B
 */
function isBefore(dateA: Date | null, dateB: Date | null): boolean {
  if (!dateA || !dateB) return false;
  return dateA < dateB;
}

/**
 * Check if date A is after date B
 */
function isAfter(dateA: Date | null, dateB: Date | null): boolean {
  if (!dateA || !dateB) return false;
  return dateA > dateB;
}

/**
 * Check if a date falls between two dates (inclusive)
 */
function isBetween(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

// ========================================
// Core Functions
// ========================================

/**
 * normalizeTimelineConfig
 * 
 * Takes current RFP row and its timelineConfig JSON
 * Ensures sensible defaults and returns fully populated RfpTimelineConfig
 */
export function normalizeTimelineConfig(rfp: RFP): RfpTimelineConfig {
  const existing = rfp.timelineConfig as any;

  // Default timezone to system default if not specified
  const timezone = existing?.timezone || "America/New_York";

  // Normalize key dates from RFP fields if not in config
  const keyDates = {
    invitationSentAt: existing?.keyDates?.invitationSentAt || toIsoStringOrNull(rfp.createdAt),
    qaOpenAt: existing?.keyDates?.qaOpenAt || toIsoStringOrNull(rfp.askQuestionsStart),
    qaCloseAt: existing?.keyDates?.qaCloseAt || toIsoStringOrNull(rfp.askQuestionsEnd),
    submissionDeadlineAt:
      existing?.keyDates?.submissionDeadlineAt || toIsoStringOrNull(rfp.submissionEnd),
    evaluationStartAt:
      existing?.keyDates?.evaluationStartAt || toIsoStringOrNull(rfp.submissionEnd),
    demoWindowStartAt:
      existing?.keyDates?.demoWindowStartAt || toIsoStringOrNull(rfp.demoWindowStart),
    demoWindowEndAt:
      existing?.keyDates?.demoWindowEndAt || toIsoStringOrNull(rfp.demoWindowEnd),
    awardTargetAt: existing?.keyDates?.awardTargetAt || toIsoStringOrNull(rfp.awardDate),
  };

  // Default automation flags to false if not specified
  const automation = {
    enableQaWindowAutoToggle: existing?.automation?.enableQaWindowAutoToggle || false,
    enableSubmissionAutoLock: existing?.automation?.enableSubmissionAutoLock || false,
    enableDemoAutoWindow: existing?.automation?.enableDemoAutoWindow || false,
    enableAwardTargetReminder: existing?.automation?.enableAwardTargetReminder || false,
    reminderRules: {
      submissionReminderDaysBefore: existing?.automation?.reminderRules?.submissionReminderDaysBefore || null,
      demoReminderDaysBefore: existing?.automation?.reminderRules?.demoReminderDaysBefore || null,
    },
  };

  return {
    version: existing?.version || 1,
    timezone,
    keyDates,
    automation,
  };
}

/**
 * computeTimelineState
 * 
 * Determines current phase based on now and keyDates
 * Computes phases, nextEvents, and various boolean flags
 * Never throws on missing dates; degrades gracefully
 */
export function computeTimelineState(
  rfp: RFP,
  config: RfpTimelineConfig,
  now: Date = new Date()
): RfpTimelineStateSnapshot {
  const { keyDates } = config;

  // Parse all key dates
  const invitationSentAt = parseIsoDate(keyDates.invitationSentAt);
  const qaOpenAt = parseIsoDate(keyDates.qaOpenAt);
  const qaCloseAt = parseIsoDate(keyDates.qaCloseAt);
  const submissionDeadlineAt = parseIsoDate(keyDates.submissionDeadlineAt);
  const evaluationStartAt = parseIsoDate(keyDates.evaluationStartAt);
  const demoWindowStartAt = parseIsoDate(keyDates.demoWindowStartAt);
  const demoWindowEndAt = parseIsoDate(keyDates.demoWindowEndAt);
  const awardTargetAt = parseIsoDate(keyDates.awardTargetAt);

  // Determine current phase
  let currentPhase: TimelinePhaseId | null = null;

  if (!invitationSentAt || isBefore(now, invitationSentAt)) {
    currentPhase = "planning";
  } else if (qaOpenAt && qaCloseAt && isBetween(now, qaOpenAt, qaCloseAt)) {
    currentPhase = "q_and_a";
  } else if (submissionDeadlineAt && isBefore(now, submissionDeadlineAt)) {
    if (qaCloseAt && isAfter(now, qaCloseAt)) {
      currentPhase = "submission";
    } else if (!qaOpenAt) {
      currentPhase = "submission";
    } else {
      currentPhase = "invitation";
    }
  } else if (demoWindowStartAt && demoWindowEndAt && isBetween(now, demoWindowStartAt, demoWindowEndAt)) {
    currentPhase = "demo";
  } else if (submissionDeadlineAt && isAfter(now, submissionDeadlineAt)) {
    if (demoWindowStartAt && isBefore(now, demoWindowStartAt)) {
      currentPhase = "evaluation";
    } else if (demoWindowEndAt && isAfter(now, demoWindowEndAt)) {
      currentPhase = "award";
    } else if (!demoWindowStartAt) {
      currentPhase = "evaluation";
    } else {
      currentPhase = "award";
    }
  } else {
    currentPhase = "award";
  }

  // Compute phases array
  const phases: RfpTimelineComputedPhase[] = [
    {
      phaseId: "planning",
      label: "Planning",
      startsAt: null,
      endsAt: toIsoStringOrNull(invitationSentAt),
      isCurrent: currentPhase === "planning",
      isCompleted: invitationSentAt ? isAfter(now, invitationSentAt) : false,
      isUpcoming: invitationSentAt ? isBefore(now, invitationSentAt) : true,
    },
    {
      phaseId: "invitation",
      label: "Invitation",
      startsAt: toIsoStringOrNull(invitationSentAt),
      endsAt: toIsoStringOrNull(qaOpenAt) || toIsoStringOrNull(submissionDeadlineAt),
      isCurrent: currentPhase === "invitation",
      isCompleted: qaOpenAt ? isAfter(now, qaOpenAt) : false,
      isUpcoming: qaOpenAt ? isBefore(now, qaOpenAt) : false,
    },
    {
      phaseId: "q_and_a",
      label: "Q&A",
      startsAt: toIsoStringOrNull(qaOpenAt),
      endsAt: toIsoStringOrNull(qaCloseAt),
      isCurrent: currentPhase === "q_and_a",
      isCompleted: qaCloseAt ? isAfter(now, qaCloseAt) : false,
      isUpcoming: qaOpenAt ? isBefore(now, qaOpenAt) : false,
    },
    {
      phaseId: "submission",
      label: "Submission",
      startsAt: toIsoStringOrNull(qaCloseAt) || toIsoStringOrNull(invitationSentAt),
      endsAt: toIsoStringOrNull(submissionDeadlineAt),
      isCurrent: currentPhase === "submission",
      isCompleted: submissionDeadlineAt ? isAfter(now, submissionDeadlineAt) : false,
      isUpcoming: submissionDeadlineAt ? isBefore(now, submissionDeadlineAt) : false,
    },
    {
      phaseId: "evaluation",
      label: "Evaluation",
      startsAt: toIsoStringOrNull(submissionDeadlineAt),
      endsAt: toIsoStringOrNull(demoWindowStartAt) || toIsoStringOrNull(awardTargetAt),
      isCurrent: currentPhase === "evaluation",
      isCompleted: demoWindowStartAt ? isAfter(now, demoWindowStartAt) : false,
      isUpcoming: demoWindowStartAt ? isBefore(now, demoWindowStartAt) : false,
    },
    {
      phaseId: "demo",
      label: "Demo",
      startsAt: toIsoStringOrNull(demoWindowStartAt),
      endsAt: toIsoStringOrNull(demoWindowEndAt),
      isCurrent: currentPhase === "demo",
      isCompleted: demoWindowEndAt ? isAfter(now, demoWindowEndAt) : false,
      isUpcoming: demoWindowStartAt ? isBefore(now, demoWindowStartAt) : false,
    },
    {
      phaseId: "award",
      label: "Award",
      startsAt: toIsoStringOrNull(demoWindowEndAt) || toIsoStringOrNull(awardTargetAt),
      endsAt: null,
      isCurrent: currentPhase === "award",
      isCompleted: false,
      isUpcoming: awardTargetAt ? isBefore(now, awardTargetAt) : false,
    },
  ];

  // Compute next events
  const nextEvents: RfpTimelineNextEvent[] = [];

  if (qaOpenAt && isAfter(qaOpenAt, now)) {
    nextEvents.push({
      timestamp: qaOpenAt.toISOString(),
      label: "Q&A Opens",
      actionId: "open_q_and_a",
      description: "Question and answer window opens for suppliers",
    });
  }

  if (qaCloseAt && isAfter(qaCloseAt, now)) {
    nextEvents.push({
      timestamp: qaCloseAt.toISOString(),
      label: "Q&A Closes",
      actionId: "close_q_and_a",
      description: "Question and answer window closes",
    });
  }

  if (submissionDeadlineAt && isAfter(submissionDeadlineAt, now)) {
    nextEvents.push({
      timestamp: submissionDeadlineAt.toISOString(),
      label: "Submission Deadline",
      actionId: "lock_submissions",
      description: "Supplier responses are locked after this date",
    });
  }

  if (demoWindowStartAt && isAfter(demoWindowStartAt, now)) {
    nextEvents.push({
      timestamp: demoWindowStartAt.toISOString(),
      label: "Demo Window Opens",
      actionId: "open_demo_window",
      description: "Demonstration window begins",
    });
  }

  if (demoWindowEndAt && isAfter(demoWindowEndAt, now)) {
    nextEvents.push({
      timestamp: demoWindowEndAt.toISOString(),
      label: "Demo Window Closes",
      actionId: "close_demo_window",
      description: "Demonstration window ends",
    });
  }

  if (awardTargetAt && isAfter(awardTargetAt, now)) {
    nextEvents.push({
      timestamp: awardTargetAt.toISOString(),
      label: "Award Target",
      actionId: "award_target_reached",
      description: "Target date for award decision",
    });
  }

  // Sort next events by timestamp
  nextEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Compute boolean flags
  const isQaOpen = qaOpenAt && qaCloseAt ? isBetween(now, qaOpenAt, qaCloseAt) : false;
  const isSubmissionsLocked = submissionDeadlineAt ? isAfter(now, submissionDeadlineAt) : false;
  const isDemoWindowOpen =
    demoWindowStartAt && demoWindowEndAt ? isBetween(now, demoWindowStartAt, demoWindowEndAt) : false;

  // Compute award target status
  let awardTargetStatus: "not_set" | "upcoming" | "past_due" | "met" = "not_set";
  if (awardTargetAt) {
    if (isBefore(now, awardTargetAt)) {
      awardTargetStatus = "upcoming";
    } else {
      awardTargetStatus = "past_due";
    }
  }

  return {
    rfpId: rfp.id,
    generatedAt: now.toISOString(),
    currentPhase,
    phases,
    nextEvents,
    isQaOpen,
    isSubmissionsLocked,
    isDemoWindowOpen,
    awardTargetStatus,
  };
}

/**
 * runRfpTimelineTick
 * 
 * Stateless function that executes automation actions based on current time
 * Safe to run multiple times (idempotent where possible)
 * 
 * Steps:
 * 1. Load RFP + current timelineConfig + relevant data
 * 2. Call normalizeTimelineConfig and computeTimelineState
 * 3. Determine which automation actions should fire at "now"
 * 4. For each applicable action:
 *    - Update RFP or related entities
 *    - Create ActivityLog entries
 *    - Optionally create notifications
 * 5. Persist updated timelineStateSnapshot
 * 6. If dryRun=true, DO NOT persist changes or send messages
 * 7. Return: snapshot and list of action IDs applied
 */
export async function runRfpTimelineTick(
  rfpId: string,
  options?: {
    forceRecompute?: boolean;
    dryRun?: boolean;
    triggeredByUserId?: string | null;
  }
): Promise<{
  snapshot: RfpTimelineStateSnapshot;
  actionsApplied: TimelineAutomationActionId[];
}> {
  const { forceRecompute = false, dryRun = false, triggeredByUserId = null } = options || {};

  // 1. Load RFP with related data
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      user: true,
      supplierContacts: true,
    },
  });

  if (!rfp) {
    throw new Error(`RFP not found: ${rfpId}`);
  }

  // 2. Normalize config and compute state
  const config = normalizeTimelineConfig(rfp);
  const now = new Date();
  const snapshot = computeTimelineState(rfp, config, now);

  // 3. Determine which actions should fire
  const actionsApplied: TimelineAutomationActionId[] = [];

  // For this initial implementation, we'll log events but not execute complex automations
  // Automation execution would require integration with notification system and more complex business logic
  
  // Example automation checks (simplified):
  if (config.automation.enableQaWindowAutoToggle && snapshot.isQaOpen) {
    // Q&A is open - could log or send notifications
    actionsApplied.push("open_q_and_a");
  }

  if (config.automation.enableSubmissionAutoLock && snapshot.isSubmissionsLocked) {
    // Submissions are locked - could update supplier contact statuses
    actionsApplied.push("lock_submissions");
  }

  if (config.automation.enableDemoAutoWindow && snapshot.isDemoWindowOpen) {
    // Demo window is open
    actionsApplied.push("open_demo_window");
  }

  // 5. Persist updated snapshot (unless dry run)
  if (!dryRun) {
    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        timelineStateSnapshot: snapshot as any,
      },
    });

    // Create timeline events for actions applied
    if (actionsApplied.length > 0) {
      await prisma.rfpTimelineEvent.createMany({
        data: actionsApplied.map((actionId) => ({
          rfpId,
          eventType: actionId.toUpperCase(),
          payload: { automated: true },
          createdById: triggeredByUserId,
        })),
      });
    }
  }

  return {
    snapshot,
    actionsApplied,
  };
}
