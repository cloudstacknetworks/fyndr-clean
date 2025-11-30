/**
 * Core Notification Library
 * STEP 22: Notifications & Reminders Engine
 */

import { PrismaClient, User, NotificationPreference, RFP } from '@prisma/client';
import {
  NotificationType,
  NotificationChannel,
  RFP_TIMELINE_QA_WINDOW_OPEN,
  RFP_TIMELINE_QA_WINDOW_CLOSING_SOON,
  RFP_TIMELINE_SUBMISSION_WINDOW_OPEN,
  RFP_TIMELINE_SUBMISSION_DEADLINE_SOON,
  RFP_TIMELINE_SUBMISSION_DEADLINE_PASSED,
  RFP_TIMELINE_DEMO_WINDOW_OPEN,
  RFP_TIMELINE_AWARD_DATE_SOON,
  RFP_TIMELINE_AWARD_DATE_PASSED,
  SUPPLIER_QUESTION_CREATED,
  SUPPLIER_QUESTION_ANSWERED,
  SUPPLIER_BROADCAST_CREATED,
  SUPPLIER_RESPONSE_SUBMITTED,
  READINESS_INDICATOR_UPDATED,
  COMPARISON_REPORT_READY,
  RFP_TIMELINE,
  SUPPLIER_QA,
  SUPPLIER_RESPONSE,
  READINESS,
  SYSTEM,
} from './notification-types';
import { sendEmail } from './email';

const prisma = new PrismaClient();

// ============================================
// PREFERENCE MANAGEMENT
// ============================================

/**
 * Get or create notification preferences for a user
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    // Create default preferences
    prefs = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        buyerRfpTimeline: true,
        buyerSupplierResponses: true,
        buyerSupplierQuestions: true,
        buyerQABroadcasts: true,
        buyerReadinessChanges: true,
        supplierQATimeline: true,
        supplierSubmissionTimeline: true,
        supplierBroadcasts: true,
        supplierResponseStatus: true,
      },
    });
  }

  return prefs;
}

/**
 * Determine if notification should be sent based on preferences and event type
 */
export function shouldSendForEvent(
  pref: NotificationPreference,
  eventType: NotificationType,
  userRole: 'buyer' | 'supplier'
): { inApp: boolean; email: boolean } {
  // Check global toggles
  const globalInApp = pref.inAppEnabled;
  const globalEmail = pref.emailEnabled;

  if (!globalInApp && !globalEmail) {
    return { inApp: false, email: false };
  }

  // Determine category-specific toggle
  let categoryEnabled = true;

  if (userRole === 'buyer') {
    // Buyer-specific mappings
    if (
      eventType === RFP_TIMELINE_QA_WINDOW_OPEN ||
      eventType === RFP_TIMELINE_QA_WINDOW_CLOSING_SOON ||
      eventType === RFP_TIMELINE_SUBMISSION_WINDOW_OPEN ||
      eventType === RFP_TIMELINE_SUBMISSION_DEADLINE_SOON ||
      eventType === RFP_TIMELINE_SUBMISSION_DEADLINE_PASSED ||
      eventType === RFP_TIMELINE_DEMO_WINDOW_OPEN ||
      eventType === RFP_TIMELINE_AWARD_DATE_SOON ||
      eventType === RFP_TIMELINE_AWARD_DATE_PASSED
    ) {
      categoryEnabled = pref.buyerRfpTimeline;
    } else if (eventType === SUPPLIER_RESPONSE_SUBMITTED) {
      categoryEnabled = pref.buyerSupplierResponses;
    } else if (eventType === SUPPLIER_QUESTION_CREATED) {
      categoryEnabled = pref.buyerSupplierQuestions;
    } else if (eventType === SUPPLIER_BROADCAST_CREATED) {
      categoryEnabled = pref.buyerQABroadcasts;
    } else if (eventType === READINESS_INDICATOR_UPDATED || eventType === COMPARISON_REPORT_READY) {
      categoryEnabled = pref.buyerReadinessChanges;
    }
  } else if (userRole === 'supplier') {
    // Supplier-specific mappings
    if (
      eventType === RFP_TIMELINE_QA_WINDOW_OPEN ||
      eventType === RFP_TIMELINE_QA_WINDOW_CLOSING_SOON
    ) {
      categoryEnabled = pref.supplierQATimeline;
    } else if (
      eventType === RFP_TIMELINE_SUBMISSION_WINDOW_OPEN ||
      eventType === RFP_TIMELINE_SUBMISSION_DEADLINE_SOON
    ) {
      categoryEnabled = pref.supplierSubmissionTimeline;
    } else if (eventType === SUPPLIER_BROADCAST_CREATED) {
      categoryEnabled = pref.supplierBroadcasts;
    } else if (eventType === SUPPLIER_QUESTION_ANSWERED) {
      categoryEnabled = pref.supplierResponseStatus;
    }
  }

  return {
    inApp: globalInApp && categoryEnabled,
    email: globalEmail && categoryEnabled,
  };
}

// ============================================
// NOTIFICATION CREATION
// ============================================

interface CreateNotificationParams {
  userId: string;
  rfpId?: string;
  supplierResponseId?: string;
  supplierContactId?: string;
  type: NotificationType;
  category: string;
  title: string;
  message: string;
  metadata?: any;
  channel: NotificationChannel;
}

/**
 * Create an in-app notification
 */
export async function createInAppNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        rfpId: params.rfpId,
        supplierResponseId: params.supplierResponseId,
        supplierContactId: params.supplierContactId,
        type: params.type,
        category: params.category,
        title: params.title,
        message: params.message,
        metadata: params.metadata || null,
        channel: params.channel,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    return null;
  }
}

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

interface SendEmailNotificationParams {
  toEmail: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send email notification using existing Resend integration
 */
export async function sendEmailNotification(params: SendEmailNotificationParams): Promise<boolean> {
  try {
    await sendEmail({
      to: params.toEmail,
      subject: params.subject,
      html: params.htmlBody,
    });
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

// ============================================
// HIGH-LEVEL NOTIFICATION ORCHESTRATOR
// ============================================

interface NotifyUserContext {
  rfpId?: string;
  rfpTitle?: string;
  supplierName?: string;
  supplierContactId?: string;
  supplierResponseId?: string;
  questionId?: string;
  broadcastId?: string;
  companyName?: string;
  [key: string]: any;
}

/**
 * High-level function to notify a user for a specific event
 */
export async function notifyUserForEvent(
  eventName: NotificationType,
  user: User,
  context: NotifyUserContext
): Promise<void> {
  try {
    // Fetch user preferences
    const prefs = await getNotificationPreferences(user.id);

    // Determine user role
    const userRole = (user.role || 'buyer') as 'buyer' | 'supplier';

    // Check if we should send notifications
    const shouldSend = shouldSendForEvent(prefs, eventName, userRole);

    if (!shouldSend.inApp && !shouldSend.email) {
      return; // User has disabled this notification type
    }

    // Build notification content based on event type
    const { title, message, category } = buildNotificationContent(eventName, context);

    // Determine channel
    let channel: NotificationChannel = 'IN_APP';
    if (shouldSend.inApp && shouldSend.email) {
      channel = 'IN_APP_EMAIL';
    } else if (shouldSend.email) {
      channel = 'EMAIL';
    }

    // Create in-app notification
    if (shouldSend.inApp) {
      await createInAppNotification({
        userId: user.id,
        rfpId: context.rfpId,
        supplierResponseId: context.supplierResponseId,
        supplierContactId: context.supplierContactId,
        type: eventName,
        category,
        title,
        message,
        metadata: context,
        channel,
      });
    }

    // Send email notification
    if (shouldSend.email && user.email) {
      const htmlBody = buildEmailContent(title, message, context);
      await sendEmailNotification({
        toEmail: user.email,
        subject: title,
        htmlBody,
      });
    }
  } catch (error) {
    console.error('Error in notifyUserForEvent:', error);
  }
}

/**
 * Build notification title, message, and category based on event type
 */
function buildNotificationContent(
  eventType: NotificationType,
  context: NotifyUserContext
): { title: string; message: string; category: string } {
  const rfpTitle = context.rfpTitle || 'RFP';
  const supplierName = context.supplierName || 'A supplier';

  switch (eventType) {
    case RFP_TIMELINE_QA_WINDOW_OPEN:
      return {
        title: 'Q&A Window Open',
        message: `The question submission window for "${rfpTitle}" is now open.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_QA_WINDOW_CLOSING_SOON:
      return {
        title: 'Q&A Window Closing Soon',
        message: `The question submission window for "${rfpTitle}" closes in 3 days.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_SUBMISSION_WINDOW_OPEN:
      return {
        title: 'Response Submission Window Open',
        message: `The response submission window for "${rfpTitle}" is now open.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_SUBMISSION_DEADLINE_SOON:
      return {
        title: 'Response Deadline Approaching',
        message: `The response submission deadline for "${rfpTitle}" is in 3 days.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_SUBMISSION_DEADLINE_PASSED:
      return {
        title: 'Response Submission Deadline Passed',
        message: `The response submission deadline for "${rfpTitle}" has passed.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_DEMO_WINDOW_OPEN:
      return {
        title: 'Demo Window Open',
        message: `The demo window for "${rfpTitle}" is now open.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_AWARD_DATE_SOON:
      return {
        title: 'Award Date Approaching',
        message: `The award date for "${rfpTitle}" is in 3 days.`,
        category: RFP_TIMELINE,
      };

    case RFP_TIMELINE_AWARD_DATE_PASSED:
      return {
        title: 'Award Date Reached',
        message: `The award date for "${rfpTitle}" has been reached.`,
        category: RFP_TIMELINE,
      };

    case SUPPLIER_QUESTION_CREATED:
      return {
        title: 'New Supplier Question',
        message: `${supplierName} has submitted a question for "${rfpTitle}".`,
        category: SUPPLIER_QA,
      };

    case SUPPLIER_QUESTION_ANSWERED:
      return {
        title: 'Your Question Was Answered',
        message: `The buyer has answered your question for "${rfpTitle}".`,
        category: SUPPLIER_QA,
      };

    case SUPPLIER_BROADCAST_CREATED:
      return {
        title: 'New Buyer Announcement',
        message: `The buyer has posted a new announcement for "${rfpTitle}".`,
        category: SUPPLIER_QA,
      };

    case SUPPLIER_RESPONSE_SUBMITTED:
      return {
        title: 'Supplier Response Submitted',
        message: `${supplierName} has submitted their response for "${rfpTitle}".`,
        category: SUPPLIER_RESPONSE,
      };

    case READINESS_INDICATOR_UPDATED:
      return {
        title: 'Supplier Readiness Updated',
        message: `Readiness indicators have been recalculated for "${rfpTitle}".`,
        category: READINESS,
      };

    case COMPARISON_REPORT_READY:
      return {
        title: 'Comparison Report Ready',
        message: `The supplier comparison report for "${rfpTitle}" is ready for download.`,
        category: SYSTEM,
      };

    default:
      return {
        title: 'RFP Notification',
        message: `An update is available for "${rfpTitle}".`,
        category: SYSTEM,
      };
  }
}

/**
 * Build HTML email content
 */
function buildEmailContent(title: string, message: string, context: NotifyUserContext): string {
  const rfpLink = context.rfpId ? `${process.env.NEXTAUTH_URL}/dashboard/rfps/${context.rfpId}` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🔔 ${escapeHtml(title)}</h2>
  </div>
  <div class="content">
    <p>${escapeHtml(message)}</p>
    ${rfpLink ? `<a href="${rfpLink}" class="button">View RFP Details</a>` : ''}
  </div>
  <div class="footer">
    <p>This notification was sent from Fyndr RFP Management System.</p>
    <p>You can manage your notification preferences in your account settings.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ============================================
// TIMELINE REMINDER RUNNER
// ============================================

/**
 * Run timeline-based reminders for all active RFPs
 * This function should be called by an external cron job or scheduler
 */
export async function runTimelineReminders(now: Date = new Date()): Promise<{
  processedRfps: number;
  notificationsCreated: number;
}> {
  let processedRfps = 0;
  let notificationsCreated = 0;

  try {
    // Fetch all active RFPs (not ARCHIVED) with timeline fields
    const rfps = await prisma.rFP.findMany({
      where: {
        stage: {
          not: 'ARCHIVED',
        },
      },
      include: {
        user: true,
        supplierContacts: {
          where: {
            portalUserId: {
              not: null,
            },
          },
          include: {
            portalUser: true,
          },
        },
      },
    });

    for (const rfp of rfps) {
      processedRfps++;

      // Get today's date (ignore time)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check Q&A window open
      if (rfp.askQuestionsStart) {
        const startDate = new Date(rfp.askQuestionsStart);
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        
        if (isSameDay(today, start)) {
          // Notify all suppliers
          for (const contact of rfp.supplierContacts) {
            if (contact.portalUser) {
              const alreadySent = await checkIfNotificationSentToday(
                contact.portalUser.id,
                rfp.id,
                RFP_TIMELINE_QA_WINDOW_OPEN
              );
              if (!alreadySent) {
                await notifyUserForEvent(RFP_TIMELINE_QA_WINDOW_OPEN, contact.portalUser, {
                  rfpId: rfp.id,
                  rfpTitle: rfp.title,
                });
                notificationsCreated++;
              }
            }
          }
        }
      }

      // Check Q&A window closing soon (3 days before)
      if (rfp.askQuestionsEnd) {
        const endDate = new Date(rfp.askQuestionsEnd);
        const threeDaysBefore = new Date(endDate);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        const compareDate = new Date(threeDaysBefore.getFullYear(), threeDaysBefore.getMonth(), threeDaysBefore.getDate());

        if (isSameDay(today, compareDate)) {
          // Notify all suppliers
          for (const contact of rfp.supplierContacts) {
            if (contact.portalUser) {
              const alreadySent = await checkIfNotificationSentToday(
                contact.portalUser.id,
                rfp.id,
                RFP_TIMELINE_QA_WINDOW_CLOSING_SOON
              );
              if (!alreadySent) {
                await notifyUserForEvent(RFP_TIMELINE_QA_WINDOW_CLOSING_SOON, contact.portalUser, {
                  rfpId: rfp.id,
                  rfpTitle: rfp.title,
                });
                notificationsCreated++;
              }
            }
          }
        }
      }

      // Check submission window open
      if (rfp.submissionStart) {
        const startDate = new Date(rfp.submissionStart);
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        if (isSameDay(today, start)) {
          // Notify all suppliers
          for (const contact of rfp.supplierContacts) {
            if (contact.portalUser) {
              const alreadySent = await checkIfNotificationSentToday(
                contact.portalUser.id,
                rfp.id,
                RFP_TIMELINE_SUBMISSION_WINDOW_OPEN
              );
              if (!alreadySent) {
                await notifyUserForEvent(RFP_TIMELINE_SUBMISSION_WINDOW_OPEN, contact.portalUser, {
                  rfpId: rfp.id,
                  rfpTitle: rfp.title,
                });
                notificationsCreated++;
              }
            }
          }
        }
      }

      // Check submission deadline soon (3 days before)
      if (rfp.submissionEnd) {
        const endDate = new Date(rfp.submissionEnd);
        const threeDaysBefore = new Date(endDate);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        const compareDate = new Date(threeDaysBefore.getFullYear(), threeDaysBefore.getMonth(), threeDaysBefore.getDate());

        if (isSameDay(today, compareDate)) {
          // Notify all suppliers
          for (const contact of rfp.supplierContacts) {
            if (contact.portalUser) {
              const alreadySent = await checkIfNotificationSentToday(
                contact.portalUser.id,
                rfp.id,
                RFP_TIMELINE_SUBMISSION_DEADLINE_SOON
              );
              if (!alreadySent) {
                await notifyUserForEvent(RFP_TIMELINE_SUBMISSION_DEADLINE_SOON, contact.portalUser, {
                  rfpId: rfp.id,
                  rfpTitle: rfp.title,
                });
                notificationsCreated++;
              }
            }
          }
        }
      }

      // Check submission deadline passed (1 day after)
      if (rfp.submissionEnd) {
        const endDate = new Date(rfp.submissionEnd);
        const oneDayAfter = new Date(endDate);
        oneDayAfter.setDate(oneDayAfter.getDate() + 1);
        const compareDate = new Date(oneDayAfter.getFullYear(), oneDayAfter.getMonth(), oneDayAfter.getDate());

        if (isSameDay(today, compareDate)) {
          // Notify buyer
          const alreadySent = await checkIfNotificationSentToday(
            rfp.user.id,
            rfp.id,
            RFP_TIMELINE_SUBMISSION_DEADLINE_PASSED
          );
          if (!alreadySent) {
            await notifyUserForEvent(RFP_TIMELINE_SUBMISSION_DEADLINE_PASSED, rfp.user, {
              rfpId: rfp.id,
              rfpTitle: rfp.title,
            });
            notificationsCreated++;
          }
        }
      }

      // Check demo window open
      if (rfp.demoWindowStart) {
        const startDate = new Date(rfp.demoWindowStart);
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        if (isSameDay(today, start)) {
          // Notify buyer
          const alreadySent = await checkIfNotificationSentToday(
            rfp.user.id,
            rfp.id,
            RFP_TIMELINE_DEMO_WINDOW_OPEN
          );
          if (!alreadySent) {
            await notifyUserForEvent(RFP_TIMELINE_DEMO_WINDOW_OPEN, rfp.user, {
              rfpId: rfp.id,
              rfpTitle: rfp.title,
            });
            notificationsCreated++;
          }
        }
      }

      // Check award date soon (3 days before)
      if (rfp.awardDate) {
        const awardDate = new Date(rfp.awardDate);
        const threeDaysBefore = new Date(awardDate);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        const compareDate = new Date(threeDaysBefore.getFullYear(), threeDaysBefore.getMonth(), threeDaysBefore.getDate());

        if (isSameDay(today, compareDate)) {
          // Notify buyer
          const alreadySent = await checkIfNotificationSentToday(
            rfp.user.id,
            rfp.id,
            RFP_TIMELINE_AWARD_DATE_SOON
          );
          if (!alreadySent) {
            await notifyUserForEvent(RFP_TIMELINE_AWARD_DATE_SOON, rfp.user, {
              rfpId: rfp.id,
              rfpTitle: rfp.title,
            });
            notificationsCreated++;
          }
        }
      }

      // Check award date reached
      if (rfp.awardDate) {
        const awardDate = new Date(rfp.awardDate);
        const award = new Date(awardDate.getFullYear(), awardDate.getMonth(), awardDate.getDate());

        if (isSameDay(today, award)) {
          // Notify buyer
          const alreadySent = await checkIfNotificationSentToday(
            rfp.user.id,
            rfp.id,
            RFP_TIMELINE_AWARD_DATE_PASSED
          );
          if (!alreadySent) {
            await notifyUserForEvent(RFP_TIMELINE_AWARD_DATE_PASSED, rfp.user, {
              rfpId: rfp.id,
              rfpTitle: rfp.title,
            });
            notificationsCreated++;
          }
        }
      }
    }

    return { processedRfps, notificationsCreated };
  } catch (error) {
    console.error('Error in runTimelineReminders:', error);
    return { processedRfps, notificationsCreated };
  }
}

/**
 * Check if a notification was already sent today
 */
async function checkIfNotificationSentToday(
  userId: string,
  rfpId: string,
  type: NotificationType
): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.notification.count({
    where: {
      userId,
      rfpId,
      type,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  return count > 0;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
