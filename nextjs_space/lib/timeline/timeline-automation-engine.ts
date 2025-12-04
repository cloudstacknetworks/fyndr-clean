/**
 * Timeline Automation Engine (STEP 55)
 * 
 * Orchestrates three automated functions:
 * 1. Auto-advance RFP stages based on timeline dates
 * 2. Generate buyer reminders for missing items and deadlines
 * 3. Generate supplier reminders for actions and deadlines
 */

import { prisma } from "@/lib/prisma";
import { RFPStage } from "@prisma/client";

// ========================================
// TypeScript Interfaces
// ========================================

export interface AutoAdvancedRfp {
  rfpId: string;
  rfpTitle: string;
  fromStage: RFPStage;
  toStage: RFPStage;
  timestamp: Date;
  reason: string;
}

export interface BuyerReminder {
  rfpId: string;
  rfpTitle: string;
  reminderType: string;
  message: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: Date | null;
  metadata?: any;
}

export interface SupplierReminder {
  rfpId: string;
  rfpTitle: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  reminderType: string;
  message: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: Date | null;
  metadata?: any;
}

export interface TimelineAutomationError {
  rfpId?: string;
  rfpTitle?: string;
  error: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

export interface TimelineAutomationResult {
  autoAdvancedRfps: AutoAdvancedRfp[];
  buyerReminders: BuyerReminder[];
  supplierReminders: SupplierReminder[];
  errors: TimelineAutomationError[];
  metadata: {
    executedAt: Date;
    companyId: string;
    totalRfpsProcessed: number;
    executionTimeMs: number;
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate hours between two dates
 */
function hoursBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60));
}

/**
 * Format date as readable string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ========================================
// Sub-Function 1: Auto-Advance Phases
// ========================================

async function autoAdvancePhases(
  companyId: string,
  errors: TimelineAutomationError[]
): Promise<AutoAdvancedRfp[]> {
  const autoAdvanced: AutoAdvancedRfp[] = [];
  const today = new Date();

  try {
    // Query all active RFPs (exclude awarded/cancelled/archived)
    const rfps = await prisma.rFP.findMany({
      where: {
        companyId,
        isArchived: false,
        NOT: {
          OR: [
            { awardStatus: "awarded" },
            { awardStatus: "cancelled" },
            { stage: RFPStage.ARCHIVED },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        stage: true,
        createdAt: true,
        askQuestionsStart: true,
        askQuestionsEnd: true,
        submissionEnd: true,
        demoWindowStart: true,
        demoWindowEnd: true,
        scoringMatrixSnapshot: true,
      },
    });

    for (const rfp of rfps) {
      let shouldAdvance = false;
      let newStage: RFPStage | null = null;
      let reason = "";

      // Rule 1: INTAKE → QUALIFICATION when createdAt date passes
      if (rfp.stage === RFPStage.INTAKE && rfp.createdAt) {
        // Auto-advance immediately for this demo (in production, might wait 1 day)
        shouldAdvance = true;
        newStage = RFPStage.QUALIFICATION;
        reason = "RFP created and ready for qualification";
      }

      // Rule 2: QUALIFICATION → DISCOVERY when askQuestionsStart date arrives
      if (rfp.stage === RFPStage.QUALIFICATION && rfp.askQuestionsStart) {
        if (rfp.askQuestionsStart <= today) {
          shouldAdvance = true;
          newStage = RFPStage.DISCOVERY;
          reason = `Q&A window start date reached (${formatDate(rfp.askQuestionsStart)})`;
        }
      }

      // Rule 3: DISCOVERY → DRAFTING when askQuestionsEnd date passes
      if (rfp.stage === RFPStage.DISCOVERY && rfp.askQuestionsEnd) {
        if (rfp.askQuestionsEnd < today) {
          shouldAdvance = true;
          newStage = RFPStage.DRAFTING;
          reason = `Q&A window closed (${formatDate(rfp.askQuestionsEnd)})`;
        }
      }

      // Rule 4: DRAFTING → PRICING_LEGAL_REVIEW when submissionEnd date passes
      if (rfp.stage === RFPStage.DRAFTING && rfp.submissionEnd) {
        if (rfp.submissionEnd < today) {
          shouldAdvance = true;
          newStage = RFPStage.PRICING_LEGAL_REVIEW;
          reason = `Submission deadline passed (${formatDate(rfp.submissionEnd)})`;
        }
      }

      // Rule 5: PRICING_LEGAL_REVIEW → EXEC_REVIEW when demoWindowStart date arrives
      if (rfp.stage === RFPStage.PRICING_LEGAL_REVIEW && rfp.demoWindowStart) {
        if (rfp.demoWindowStart <= today) {
          shouldAdvance = true;
          newStage = RFPStage.EXEC_REVIEW;
          reason = `Demo window start date reached (${formatDate(rfp.demoWindowStart)})`;
        }
      }

      // Rule 6: EXEC_REVIEW → SUBMISSION when demoWindowEnd date passes AND scoringMatrix exists
      if (rfp.stage === RFPStage.EXEC_REVIEW && rfp.demoWindowEnd) {
        if (rfp.demoWindowEnd < today) {
          if (rfp.scoringMatrixSnapshot) {
            shouldAdvance = true;
            newStage = RFPStage.SUBMISSION;
            reason = `Demo window closed and scoring matrix ready (${formatDate(
              rfp.demoWindowEnd
            )})`;
          } else {
            // Flag for buyer reminder: missing scoring matrix
            errors.push({
              rfpId: rfp.id,
              rfpTitle: rfp.title,
              error: "MISSING_SCORING_MATRIX",
              message: `Cannot auto-advance to SUBMISSION: scoring matrix required`,
              severity: "WARNING",
            });
          }
        }
      }

      // Rule 7: SUBMISSION → DEBRIEF (no automatic rule, manual only)
      // DEBRIEF stage is the final pre-award stage

      // Execute stage advancement
      if (shouldAdvance && newStage) {
        try {
          await prisma.rFP.update({
            where: { id: rfp.id },
            data: {
              stage: newStage,
              stageEnteredAt: today,
            },
          });

          // Log to ActivityLog
          await prisma.activityLog.create({
            data: {
              eventType: "RFP_STAGE_ADVANCED",
              actorRole: "SYSTEM",
              rfpId: rfp.id,
              summary: `Stage auto-advanced: ${rfp.stage} → ${newStage}`,
              details: {
                fromStage: rfp.stage,
                toStage: newStage,
                reason,
                automated: true,
              },
            },
          });

          autoAdvanced.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            fromStage: rfp.stage,
            toStage: newStage,
            timestamp: today,
            reason,
          });
        } catch (error: any) {
          errors.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            error: "STAGE_ADVANCEMENT_FAILED",
            message: `Failed to advance stage: ${error.message}`,
            severity: "ERROR",
          });
        }
      }
    }
  } catch (error: any) {
    errors.push({
      error: "AUTO_ADVANCE_FAILURE",
      message: `Failed to process auto-advance: ${error.message}`,
      severity: "ERROR",
    });
  }

  return autoAdvanced;
}

// ========================================
// Sub-Function 2: Generate Buyer Reminders
// ========================================

async function generateBuyerReminders(
  companyId: string,
  errors: TimelineAutomationError[]
): Promise<BuyerReminder[]> {
  const reminders: BuyerReminder[] = [];
  const today = new Date();

  try {
    // Query all active RFPs with related data
    const rfps = await prisma.rFP.findMany({
      where: {
        companyId,
        isArchived: false,
        NOT: {
          OR: [
            { awardStatus: "awarded" },
            { awardStatus: "cancelled" },
          ],
        },
      },
      include: {
        supplierContacts: {
          include: {
            supplierResponse: true,
          },
        },
        supplierQuestions: {
          where: { status: "PENDING" },
        },
        activityLogs: {
          where: {
            eventType: "RFP_STAGE_ADVANCED",
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    for (const rfp of rfps) {
      // Reminder 1: Missing Decision Brief
      if (rfp.stage === RFPStage.DEBRIEF && !rfp.decisionBriefSnapshot) {
        reminders.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          reminderType: "MISSING_DECISION_BRIEF",
          message: `Decision brief missing for RFP: ${rfp.title}`,
          urgency: "HIGH",
          dueDate: null,
        });
      }

      // Reminder 2: Missing Scoring Matrix
      if (
        (rfp.stage === RFPStage.EXEC_REVIEW || rfp.stage === RFPStage.SUBMISSION || rfp.stage === RFPStage.DEBRIEF) &&
        !rfp.scoringMatrixSnapshot
      ) {
        reminders.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          reminderType: "MISSING_SCORING_MATRIX",
          message: `Scoring matrix missing for RFP: ${rfp.title}`,
          urgency: rfp.stage === RFPStage.DEBRIEF ? "CRITICAL" : "HIGH",
          dueDate: null,
        });
      }

      // Reminder 3: Missing Executive Summary (using decisionBriefSnapshot as proxy)
      if (
        (rfp.stage === RFPStage.PRICING_LEGAL_REVIEW || rfp.stage === RFPStage.EXEC_REVIEW || rfp.stage === RFPStage.DEBRIEF) &&
        !rfp.decisionBriefSnapshot
      ) {
        reminders.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          reminderType: "MISSING_EXECUTIVE_SUMMARY",
          message: `Executive summary missing for RFP: ${rfp.title}`,
          urgency: "MEDIUM",
          dueDate: null,
        });
      }

      // Reminder 4: Overdue Award Decision
      if (rfp.stage === RFPStage.DEBRIEF && rfp.awardDate && rfp.awardDate < today) {
        const daysOverdue = daysBetween(rfp.awardDate, today);
        reminders.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          reminderType: "AWARD_DECISION_OVERDUE",
          message: `Award decision overdue by ${daysOverdue} days for RFP: ${rfp.title}`,
          urgency: "CRITICAL",
          dueDate: rfp.awardDate,
        });
      }

      // Reminder 5: Phase Stuck Too Long (>30 days in same stage)
      if (rfp.activityLogs.length > 0) {
        const lastStageChange = rfp.activityLogs[0];
        const daysInStage = daysBetween(lastStageChange.createdAt, today);
        if (daysInStage > 30) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            reminderType: "PHASE_STUCK_TOO_LONG",
            message: `RFP stuck in ${rfp.stage} for ${daysInStage} days: ${rfp.title}`,
            urgency: "MEDIUM",
            dueDate: null,
            metadata: { daysInStage },
          });
        }
      }

      // Reminder 6: Submission Due Within 3 Days
      if (rfp.submissionEnd) {
        const daysUntil = daysBetween(today, rfp.submissionEnd);
        if (rfp.submissionEnd > today && daysUntil <= 3) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            reminderType: "SUBMISSION_DEADLINE_SOON",
            message: `Submission deadline in ${daysUntil} days for RFP: ${rfp.title}`,
            urgency: "HIGH",
            dueDate: rfp.submissionEnd,
          });
        }
      }

      // Reminder 7: Q&A Closing Within 48 Hours
      if (rfp.askQuestionsEnd) {
        const hoursUntil = hoursBetween(today, rfp.askQuestionsEnd);
        if (rfp.askQuestionsEnd > today && hoursUntil <= 48) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            reminderType: "QA_CLOSING_SOON",
            message: `Q&A window closing in ${hoursUntil} hours for RFP: ${rfp.title}`,
            urgency: "HIGH",
            dueDate: rfp.askQuestionsEnd,
          });
        }
      }

      // Reminder 8: Demo Window Starting or Ending
      if (rfp.demoWindowStart) {
        const daysUntilStart = daysBetween(today, rfp.demoWindowStart);
        if (rfp.demoWindowStart > today && daysUntilStart <= 3) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            reminderType: "DEMO_WINDOW_STARTING",
            message: `Demo window starting in ${daysUntilStart} days for RFP: ${rfp.title}`,
            urgency: "MEDIUM",
            dueDate: rfp.demoWindowStart,
          });
        }
      }
      if (rfp.demoWindowEnd) {
        const daysUntilEnd = daysBetween(today, rfp.demoWindowEnd);
        if (rfp.demoWindowEnd > today && daysUntilEnd <= 3) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            reminderType: "DEMO_WINDOW_ENDING",
            message: `Demo window ending in ${daysUntilEnd} days for RFP: ${rfp.title}`,
            urgency: "MEDIUM",
            dueDate: rfp.demoWindowEnd,
          });
        }
      }

      // Reminder 9: Supplier Non-Submissions (48 hours before deadline)
      if (rfp.submissionEnd) {
        const hoursUntilDeadline = hoursBetween(today, rfp.submissionEnd);
        if (rfp.submissionEnd > today && hoursUntilDeadline <= 48) {
          const nonSubmittedSuppliers = rfp.supplierContacts.filter(
            (contact) =>
              contact.invitationStatus === "SENT" ||
              contact.invitationStatus === "ACCEPTED"
          ).filter((contact) => {
            const response = contact.supplierResponse;
            return !response || response.status !== "SUBMITTED";
          });

          if (nonSubmittedSuppliers.length > 0) {
            reminders.push({
              rfpId: rfp.id,
              rfpTitle: rfp.title,
              reminderType: "SUPPLIER_NON_SUBMISSIONS",
              message: `${nonSubmittedSuppliers.length} suppliers have not submitted for RFP: ${rfp.title}`,
              urgency: "HIGH",
              dueDate: rfp.submissionEnd,
              metadata: {
                nonSubmittedCount: nonSubmittedSuppliers.length,
                suppliers: nonSubmittedSuppliers.map((s) => s.name),
              },
            });
          }
        }
      }
    }
  } catch (error: any) {
    errors.push({
      error: "BUYER_REMINDERS_FAILURE",
      message: `Failed to generate buyer reminders: ${error.message}`,
      severity: "ERROR",
    });
  }

  return reminders;
}

// ========================================
// Sub-Function 3: Generate Supplier Reminders
// ========================================

async function generateSupplierReminders(
  companyId: string,
  errors: TimelineAutomationError[]
): Promise<SupplierReminder[]> {
  const reminders: SupplierReminder[] = [];
  const today = new Date();

  try {
    // Query all active RFPs with supplier contacts
    const rfps = await prisma.rFP.findMany({
      where: {
        companyId,
        isArchived: false,
        NOT: {
          OR: [
            { awardStatus: "awarded" },
            { awardStatus: "cancelled" },
          ],
        },
      },
      include: {
        supplierContacts: {
          where: {
            OR: [
              { invitationStatus: "SENT" },
              { invitationStatus: "ACCEPTED" },
            ],
          },
          include: {
            supplierResponse: true,
            supplierQuestions: {
              where: { status: "PENDING" },
            },
          },
        },
        activityLogs: {
          where: {
            OR: [
              { eventType: "SUPPLIER_QUESTION_ANSWERED" },
              { eventType: "RFP_UPDATED" },
            ],
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        },
      },
    });

    for (const rfp of rfps) {
      for (const supplierContact of rfp.supplierContacts) {
        const response = supplierContact.supplierResponse;

        // Reminder 1: Submission Deadline Approaching (≤5 days)
        if (rfp.submissionEnd && rfp.submissionEnd > today) {
          const daysUntil = daysBetween(today, rfp.submissionEnd);
          if (daysUntil <= 5 && (!response || response.status !== "SUBMITTED")) {
            reminders.push({
              rfpId: rfp.id,
              rfpTitle: rfp.title,
              supplierId: supplierContact.id,
              supplierName: supplierContact.name,
              supplierEmail: supplierContact.email,
              reminderType: "SUBMISSION_DEADLINE_APPROACHING",
              message: `Submission deadline in ${daysUntil} days for RFP: ${rfp.title}`,
              urgency: daysUntil <= 3 ? "HIGH" : "MEDIUM",
              dueDate: rfp.submissionEnd,
            });
          }
        }

        // Reminder 2: Submission Overdue
        if (rfp.submissionEnd && rfp.submissionEnd < today) {
          if (!response || response.status !== "SUBMITTED") {
            const daysOverdue = daysBetween(rfp.submissionEnd, today);
            reminders.push({
              rfpId: rfp.id,
              rfpTitle: rfp.title,
              supplierId: supplierContact.id,
              supplierName: supplierContact.name,
              supplierEmail: supplierContact.email,
              reminderType: "SUBMISSION_OVERDUE",
              message: `Submission overdue by ${daysOverdue} days for RFP: ${rfp.title}`,
              urgency: "CRITICAL",
              dueDate: rfp.submissionEnd,
            });
          }
        }

        // Reminder 3: Q&A Questions Unanswered
        const unansweredQuestions = supplierContact.supplierQuestions.filter(
          (q) => q.status === "PENDING"
        );
        if (unansweredQuestions.length > 0) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            supplierId: supplierContact.id,
            supplierName: supplierContact.name,
            supplierEmail: supplierContact.email,
            reminderType: "UNANSWERED_QUESTIONS",
            message: `${unansweredQuestions.length} unanswered questions for RFP: ${rfp.title}`,
            urgency: "MEDIUM",
            dueDate: null,
            metadata: {
              questionCount: unansweredQuestions.length,
            },
          });
        }

        // Reminder 4: Demo Date Coming Soon
        if (rfp.demoWindowStart && rfp.demoWindowStart > today) {
          const daysUntil = daysBetween(today, rfp.demoWindowStart);
          if (daysUntil <= 7) {
            reminders.push({
              rfpId: rfp.id,
              rfpTitle: rfp.title,
              supplierId: supplierContact.id,
              supplierName: supplierContact.name,
              supplierEmail: supplierContact.email,
              reminderType: "DEMO_DATE_SOON",
              message: `Demo scheduled in ${daysUntil} days for RFP: ${rfp.title}`,
              urgency: "MEDIUM",
              dueDate: rfp.demoWindowStart,
            });
          }
        }

        // Reminder 5: Buyer Has Posted New Q&A Answers
        const recentQaActivity = rfp.activityLogs.filter(
          (log) => log.eventType === "SUPPLIER_QUESTION_ANSWERED"
        );
        if (recentQaActivity.length > 0) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            supplierId: supplierContact.id,
            supplierName: supplierContact.name,
            supplierEmail: supplierContact.email,
            reminderType: "NEW_QA_ANSWERS",
            message: `New Q&A answers posted for RFP: ${rfp.title}`,
            urgency: "LOW",
            dueDate: null,
            metadata: {
              answersCount: recentQaActivity.length,
            },
          });
        }

        // Reminder 6: Buyer Has Updated the RFP
        const recentRfpUpdates = rfp.activityLogs.filter(
          (log) => log.eventType === "RFP_UPDATED"
        );
        if (recentRfpUpdates.length > 0) {
          reminders.push({
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            supplierId: supplierContact.id,
            supplierName: supplierContact.name,
            supplierEmail: supplierContact.email,
            reminderType: "RFP_UPDATED",
            message: `RFP updated by buyer: ${rfp.title}`,
            urgency: "MEDIUM",
            dueDate: null,
            metadata: {
              updatesCount: recentRfpUpdates.length,
            },
          });
        }
      }
    }
  } catch (error: any) {
    errors.push({
      error: "SUPPLIER_REMINDERS_FAILURE",
      message: `Failed to generate supplier reminders: ${error.message}`,
      severity: "ERROR",
    });
  }

  return reminders;
}

// ========================================
// Main Orchestration Function
// ========================================

/**
 * runTimelineAutomation
 * 
 * Main entry point for timeline automation.
 * Orchestrates the three sub-functions and returns comprehensive results.
 */
export async function runTimelineAutomation(
  companyId: string
): Promise<TimelineAutomationResult> {
  const startTime = Date.now();
  const errors: TimelineAutomationError[] = [];

  // Validate companyId
  if (!companyId) {
    errors.push({
      error: "INVALID_COMPANY_ID",
      message: "Company ID is required",
      severity: "ERROR",
    });
    return {
      autoAdvancedRfps: [],
      buyerReminders: [],
      supplierReminders: [],
      errors,
      metadata: {
        executedAt: new Date(),
        companyId: "",
        totalRfpsProcessed: 0,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  // Run all three sub-functions in parallel
  const [autoAdvancedRfps, buyerReminders, supplierReminders] = await Promise.all([
    autoAdvancePhases(companyId, errors),
    generateBuyerReminders(companyId, errors),
    generateSupplierReminders(companyId, errors),
  ]);

  // Calculate total RFPs processed
  const rfpIds = new Set([
    ...autoAdvancedRfps.map((r) => r.rfpId),
    ...buyerReminders.map((r) => r.rfpId),
    ...supplierReminders.map((r) => r.rfpId),
  ]);

  return {
    autoAdvancedRfps,
    buyerReminders,
    supplierReminders,
    errors,
    metadata: {
      executedAt: new Date(),
      companyId,
      totalRfpsProcessed: rfpIds.size,
      executionTimeMs: Date.now() - startTime,
    },
  };
}
