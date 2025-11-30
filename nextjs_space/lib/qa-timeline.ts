/**
 * STEP 21: Supplier Q&A Timeline Enforcement Utilities
 * 
 * Provides functions to enforce question submission windows based on
 * askQuestionsStart and askQuestionsEnd timeline fields.
 */

import { RFP } from '@prisma/client';

export type QuestionWindowStatus = 'NOT_OPEN' | 'OPEN' | 'CLOSED';

/**
 * Check if the question submission window is currently open
 */
export function isQuestionWindowOpen(rfp: Pick<RFP, 'askQuestionsStart' | 'askQuestionsEnd'>): boolean {
  const now = new Date();
  
  // If no dates are set, window is not open
  if (!rfp.askQuestionsStart || !rfp.askQuestionsEnd) {
    return false;
  }
  
  const start = new Date(rfp.askQuestionsStart);
  const end = new Date(rfp.askQuestionsEnd);
  
  return now >= start && now <= end;
}

/**
 * Get the current status of the question window
 */
export function getQuestionWindowStatus(rfp: Pick<RFP, 'askQuestionsStart' | 'askQuestionsEnd'>): QuestionWindowStatus {
  const now = new Date();
  
  // If dates are not set, treat as not open
  if (!rfp.askQuestionsStart || !rfp.askQuestionsEnd) {
    return 'NOT_OPEN';
  }
  
  const start = new Date(rfp.askQuestionsStart);
  const end = new Date(rfp.askQuestionsEnd);
  
  if (now < start) {
    return 'NOT_OPEN';
  }
  
  if (now > end) {
    return 'CLOSED';
  }
  
  return 'OPEN';
}

/**
 * Get a user-friendly message about the question window status
 */
export function getQuestionWindowMessage(rfp: Pick<RFP, 'askQuestionsStart' | 'askQuestionsEnd'>): string {
  const status = getQuestionWindowStatus(rfp);
  
  if (!rfp.askQuestionsStart || !rfp.askQuestionsEnd) {
    return 'Question submission window has not been configured yet.';
  }
  
  const start = new Date(rfp.askQuestionsStart);
  const end = new Date(rfp.askQuestionsEnd);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  switch (status) {
    case 'NOT_OPEN':
      return `Questions window not open yet. Opens on ${formatDate(start)}.`;
    case 'OPEN':
      return `Questions window is open. Closes on ${formatDate(end)}.`;
    case 'CLOSED':
      return `Questions window is closed. Closed on ${formatDate(end)}.`;
  }
}

/**
 * Get days remaining in the question window (positive if open, negative if past)
 */
export function getDaysRemainingInQuestionWindow(rfp: Pick<RFP, 'askQuestionsStart' | 'askQuestionsEnd'>): number | null {
  if (!rfp.askQuestionsEnd) {
    return null;
  }
  
  const now = new Date();
  const end = new Date(rfp.askQuestionsEnd);
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get styling classes based on question window status
 */
export function getQuestionWindowStyles(status: QuestionWindowStatus): {
  badgeClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'OPEN':
      return {
        badgeClass: 'bg-green-100 text-green-800 border-green-300',
        textClass: 'text-green-700',
        borderClass: 'border-green-300'
      };
    case 'NOT_OPEN':
      return {
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        textClass: 'text-yellow-700',
        borderClass: 'border-yellow-300'
      };
    case 'CLOSED':
      return {
        badgeClass: 'bg-red-100 text-red-800 border-red-300',
        textClass: 'text-red-700',
        borderClass: 'border-red-300'
      };
  }
}
