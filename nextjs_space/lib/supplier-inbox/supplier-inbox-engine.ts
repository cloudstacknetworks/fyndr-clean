/**
 * STEP 54: Supplier Work Inbox & Notifications Panel
 * Core business logic for building supplier inbox data
 */

import { prisma } from '@/lib/prisma';
import { RFPStage } from '@prisma/client';

/**
 * Action types for supplier inbox
 */
type ActionType = 
  | 'submit_proposal'
  | 'answer_questions'
  | 'upload_documents'
  | 'respond_to_revision';

/**
 * Urgency tags for pending actions
 */
type UrgencyTag = 'overdue' | 'due_soon' | 'waiting_on_you';

/**
 * Urgency levels for deadlines
 */
type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Deadline types
 */
type DeadlineType = 
  | 'submission' 
  | 'qa' 
  | 'demo' 
  | 'confirmation';

/**
 * Pending action item
 */
interface PendingAction {
  rfpId: string;
  rfpTitle: string;
  actionType: ActionType;
  dueDate: Date | null;
  urgencyTag: UrgencyTag;
  link: string;
}

/**
 * Upcoming deadline item
 */
interface UpcomingDeadline {
  rfpId: string;
  rfpTitle: string;
  deadlineType: DeadlineType;
  date: Date;
  daysRemaining: number;
  urgencyLevel: UrgencyLevel;
}

/**
 * Invitation and Q&A item
 */
interface InvitationQA {
  rfpId: string;
  rfpTitle: string;
  invitationStatus: string | null;
  questionCount: number;
  messageCount: number;
  link: string;
}

/**
 * Recent activity item
 */
interface RecentActivity {
  timestamp: Date;
  rfpTitle: string;
  actionDescription: string;
  eventType: string;
}

/**
 * Complete inbox data structure
 */
export interface SupplierInboxData {
  pendingActions: PendingAction[];
  upcomingDeadlines: UpcomingDeadline[];
  invitationsAndQA: InvitationQA[];
  recentActivity: RecentActivity[];
  counts: {
    pendingActionsCount: number;
    deadlinesCount: number;
    invitationsCount: number;
    activityCount: number;
  };
}

/**
 * Calculate urgency tag based on due date
 */
function calculateUrgencyTag(dueDate: Date | null, now: Date): UrgencyTag {
  if (!dueDate) return 'waiting_on_you';
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'due_soon';
  return 'waiting_on_you';
}

/**
 * Calculate urgency level based on days remaining
 */
function calculateUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 10) return 'high';
  if (daysRemaining <= 20) return 'medium';
  return 'low';
}

/**
 * Calculate days remaining until a date
 */
function calculateDaysRemaining(date: Date, now: Date): number {
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Build supplier inbox data
 * @param userId - The supplier user ID
 * @returns Complete inbox data structure
 */
export async function buildSupplierInbox(userId: string): Promise<SupplierInboxData> {
  const now = new Date();
  
  // Get all RFPs where supplier is invited
  const supplierContacts = await prisma.supplierContact.findMany({
    where: {
      portalUserId: userId
    },
    include: {
      rfp: {
        include: {
          company: true,
          supplier: true,
          supplierQuestions: {
            where: {
              supplierContact: {
                portalUserId: userId
              }
            }
          },
          supplierBroadcastMessages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      },
      supplierResponse: true
    }
  });

  // **Section A: Pending Actions**
  const pendingActions: PendingAction[] = [];
  
  for (const contact of supplierContacts) {
    const rfp = contact.rfp;
    const response = contact.supplierResponse;
    
    // Check if proposal needs to be submitted
    if (!response || response.status !== 'SUBMITTED') {
      pendingActions.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        actionType: 'submit_proposal',
        dueDate: rfp.submissionEnd,
        urgencyTag: calculateUrgencyTag(rfp.submissionEnd, now),
        link: `/supplier/rfps/${rfp.id}`
      });
    }
    
    // Check for unanswered questions
    const unansweredQuestions = await prisma.supplierQuestion.findMany({
      where: {
        rfpId: rfp.id,
        supplierContactId: contact.id,
        status: 'PENDING'
      }
    });
    
    if (unansweredQuestions.length > 0) {
      pendingActions.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        actionType: 'answer_questions',
        dueDate: rfp.submissionEnd,
        urgencyTag: calculateUrgencyTag(rfp.submissionEnd, now),
        link: `/supplier/rfps/${rfp.id}/questions`
      });
    }
    
    // Note: Attachment check could be added here if needed by including
    // SupplierResponseAttachment relation in the query above
  }
  
  // **Section B: Upcoming Deadlines**
  const upcomingDeadlines: UpcomingDeadline[] = [];
  
  for (const contact of supplierContacts) {
    const rfp = contact.rfp;
    
    // Submission deadline
    if (rfp.submissionEnd && rfp.submissionEnd > now) {
      const daysRemaining = calculateDaysRemaining(rfp.submissionEnd, now);
      upcomingDeadlines.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        deadlineType: 'submission',
        date: rfp.submissionEnd,
        daysRemaining,
        urgencyLevel: calculateUrgencyLevel(daysRemaining)
      });
    }
    
    // Q&A deadline
    if (rfp.askQuestionsEnd && rfp.askQuestionsEnd > now) {
      const daysRemaining = calculateDaysRemaining(rfp.askQuestionsEnd, now);
      upcomingDeadlines.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        deadlineType: 'qa',
        date: rfp.askQuestionsEnd,
        daysRemaining,
        urgencyLevel: calculateUrgencyLevel(daysRemaining)
      });
    }
    
    // Demo window
    if (rfp.demoWindowStart && rfp.demoWindowStart > now) {
      const daysRemaining = calculateDaysRemaining(rfp.demoWindowStart, now);
      upcomingDeadlines.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        deadlineType: 'demo',
        date: rfp.demoWindowStart,
        daysRemaining,
        urgencyLevel: calculateUrgencyLevel(daysRemaining)
      });
    }
  }
  
  // Sort by urgency and date
  upcomingDeadlines.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
      return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    }
    return a.date.getTime() - b.date.getTime();
  });
  
  // **Section C: Invitations & Q&A**
  const invitationsAndQA: InvitationQA[] = [];
  
  for (const contact of supplierContacts) {
    const rfp = contact.rfp;
    
    // Count pending questions for this RFP
    const questionCount = await prisma.supplierQuestion.count({
      where: {
        rfpId: rfp.id,
        supplierContactId: contact.id,
        status: 'PENDING'
      }
    });
    
    // Count broadcast messages (unread concept - simplified as total count)
    const messageCount = rfp.supplierBroadcastMessages?.length || 0;
    
    // Add to list if pending invitation or has questions/messages
    if (contact.invitationStatus === 'PENDING' || contact.invitationStatus === 'SENT' || questionCount > 0 || messageCount > 0) {
      invitationsAndQA.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        invitationStatus: contact.invitationStatus,
        questionCount,
        messageCount,
        link: `/supplier/rfps/${rfp.id}`
      });
    }
  }
  
  // **Section D: Recent Activity From Buyer**
  const recentActivity: RecentActivity[] = [];
  
  // Get activity logs for RFPs where supplier is invited
  const rfpIds = supplierContacts.map(c => c.rfpId);
  
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      rfpId: {
        in: rfpIds
      },
      eventType: {
        in: [
          'award_committed',
          'award_previewed',
          'comparison_matrix_recomputed',
          'exec_summary_generated',
          'submission_received',
          'SUPPLIER_QUESTION_ANSWERED',
          'SUPPLIER_BROADCAST_CREATED'
        ]
      },
      createdAt: {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    include: {
      rfp: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
  
  for (const log of activityLogs) {
    if (log.rfp) {
      recentActivity.push({
        timestamp: log.createdAt,
        rfpTitle: log.rfp.title,
        actionDescription: log.summary || log.eventType,
        eventType: log.eventType
      });
    }
  }
  
  // Calculate counts
  const counts = {
    pendingActionsCount: pendingActions.length,
    deadlinesCount: upcomingDeadlines.length,
    invitationsCount: invitationsAndQA.length,
    activityCount: recentActivity.length
  };
  
  return {
    pendingActions,
    upcomingDeadlines,
    invitationsAndQA,
    recentActivity,
    counts
  };
}
