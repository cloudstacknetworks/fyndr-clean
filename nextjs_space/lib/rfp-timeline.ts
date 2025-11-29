/**
 * RFP Timeline & Milestones Helper Functions (STEP 14)
 * 
 * This library provides utilities for managing and displaying RFP timeline windows,
 * including validation, status calculation, and milestone tracking.
 */

import { RFP } from '@prisma/client';

/**
 * Timeline window types
 */
export type TimelineWindow = 
  | 'askQuestions' 
  | 'submissions' 
  | 'demoWindow' 
  | 'awardDate' 
  | null;

/**
 * Window status types
 */
export type WindowStatus = 'future' | 'active' | 'overdue' | 'completed';

/**
 * Timeline milestone interface
 */
export interface TimelineMilestone {
  id: TimelineWindow;
  label: string;
  start?: Date | null;
  end?: Date | null;
  status: WindowStatus;
  daysRemaining?: number;
}

/**
 * Validates timeline configuration
 * Returns error message if invalid, null if valid
 */
export function validateTimeline(data: {
  askQuestionsStart?: Date | null;
  askQuestionsEnd?: Date | null;
  submissionStart?: Date | null;
  submissionEnd?: Date | null;
  demoWindowStart?: Date | null;
  demoWindowEnd?: Date | null;
  awardDate?: Date | null;
}): string | null {
  const {
    askQuestionsStart,
    askQuestionsEnd,
    submissionStart,
    submissionEnd,
    demoWindowStart,
    demoWindowEnd,
    awardDate,
  } = data;

  // Validate askQuestions window
  if (askQuestionsStart && askQuestionsEnd) {
    if (askQuestionsStart > askQuestionsEnd) {
      return 'Invalid timeline configuration: Questions start date must be before end date';
    }
  }

  // Validate submissions window
  if (submissionStart && submissionEnd) {
    if (submissionStart > submissionEnd) {
      return 'Invalid timeline configuration: Submission start date must be before end date';
    }
  }

  // Validate askQuestions ends before submissions start
  if (askQuestionsEnd && submissionStart) {
    if (askQuestionsEnd > submissionStart) {
      return 'Invalid timeline configuration: Questions must close before submissions open';
    }
  }

  // Validate submissions ends before demo window starts
  if (submissionEnd && demoWindowStart) {
    if (submissionEnd > demoWindowStart) {
      return 'Invalid timeline configuration: Submissions must close before demo window starts';
    }
  }

  // Validate demo window
  if (demoWindowStart && demoWindowEnd) {
    if (demoWindowStart > demoWindowEnd) {
      return 'Invalid timeline configuration: Demo window start date must be before end date';
    }
  }

  // Validate demo window ends before award date
  if (demoWindowEnd && awardDate) {
    if (demoWindowEnd > awardDate) {
      return 'Invalid timeline configuration: Demo window must close before award date';
    }
  }

  return null;
}

/**
 * Gets the status of a time window
 */
export function getWindowStatus(
  start: Date | null | undefined,
  end: Date | null | undefined,
  now: Date = new Date()
): WindowStatus {
  if (!start && !end) {
    return 'future';
  }

  // If only end date is set (like awardDate)
  if (!start && end) {
    const endDate = new Date(end);
    if (now > endDate) {
      return 'completed';
    } else if (now < endDate) {
      return 'future';
    }
    return 'active';
  }

  // If both dates are set
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) {
      return 'future';
    } else if (now >= startDate && now <= endDate) {
      return 'active';
    } else if (now > endDate) {
      return 'overdue';
    }
  }

  // If only start date is set
  if (start && !end) {
    const startDate = new Date(start);
    if (now < startDate) {
      return 'future';
    } else {
      return 'active';
    }
  }

  return 'future';
}

/**
 * Gets the number of days remaining until a date
 * Returns negative if date is in the past
 */
export function getDaysRemaining(date: Date | null | undefined): number | null {
  if (!date) return null;

  const targetDate = new Date(date);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Gets the current active window for an RFP
 */
export function getCurrentWindow(
  rfp: Pick<RFP, 
    'askQuestionsStart' | 'askQuestionsEnd' | 
    'submissionStart' | 'submissionEnd' | 
    'demoWindowStart' | 'demoWindowEnd' | 
    'awardDate'
  >
): TimelineWindow {
  const now = new Date();

  // Check askQuestions window
  if (rfp.askQuestionsStart && rfp.askQuestionsEnd) {
    const status = getWindowStatus(rfp.askQuestionsStart, rfp.askQuestionsEnd, now);
    if (status === 'active') {
      return 'askQuestions';
    }
  }

  // Check submissions window
  if (rfp.submissionStart && rfp.submissionEnd) {
    const status = getWindowStatus(rfp.submissionStart, rfp.submissionEnd, now);
    if (status === 'active') {
      return 'submissions';
    }
  }

  // Check demo window
  if (rfp.demoWindowStart && rfp.demoWindowEnd) {
    const status = getWindowStatus(rfp.demoWindowStart, rfp.demoWindowEnd, now);
    if (status === 'active') {
      return 'demoWindow';
    }
  }

  // Check if award date is upcoming
  if (rfp.awardDate) {
    const status = getWindowStatus(null, rfp.awardDate, now);
    if (status === 'future' || status === 'active') {
      return 'awardDate';
    }
  }

  return null;
}

/**
 * Gets all timeline milestones with their status
 */
export function getTimelineMilestones(
  rfp: Pick<RFP, 
    'askQuestionsStart' | 'askQuestionsEnd' | 
    'submissionStart' | 'submissionEnd' | 
    'demoWindowStart' | 'demoWindowEnd' | 
    'awardDate'
  >
): TimelineMilestone[] {
  const now = new Date();

  return [
    {
      id: 'askQuestions',
      label: 'Ask Questions',
      start: rfp.askQuestionsStart,
      end: rfp.askQuestionsEnd,
      status: getWindowStatus(rfp.askQuestionsStart, rfp.askQuestionsEnd, now),
      daysRemaining: getDaysRemaining(rfp.askQuestionsEnd) ?? undefined,
    },
    {
      id: 'submissions',
      label: 'Submissions',
      start: rfp.submissionStart,
      end: rfp.submissionEnd,
      status: getWindowStatus(rfp.submissionStart, rfp.submissionEnd, now),
      daysRemaining: getDaysRemaining(rfp.submissionEnd) ?? undefined,
    },
    {
      id: 'demoWindow',
      label: 'Demo Window',
      start: rfp.demoWindowStart,
      end: rfp.demoWindowEnd,
      status: getWindowStatus(rfp.demoWindowStart, rfp.demoWindowEnd, now),
      daysRemaining: getDaysRemaining(rfp.demoWindowEnd) ?? undefined,
    },
    {
      id: 'awardDate',
      label: 'Award Date',
      start: null,
      end: rfp.awardDate,
      status: getWindowStatus(null, rfp.awardDate, now),
      daysRemaining: getDaysRemaining(rfp.awardDate) ?? undefined,
    },
  ];
}

/**
 * Gets color classes based on window status
 */
export function getStatusColor(status: WindowStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-500',
      };
    case 'overdue':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-500',
      };
    case 'completed':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-500',
      };
    case 'future':
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-400',
      };
  }
}

/**
 * Formats date for display
 */
export function formatTimelineDate(date: Date | null | undefined): string {
  if (!date) return 'Not Set';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
