/**
 * Global Notifications Center Engine (STEP 51)
 * 
 * This file provides the business logic for building buyer-only, read-only notifications
 * derived from existing activity logs.
 */

import { prisma } from "@/lib/prisma";
import { EVENT_TYPES, getEventCategory } from "@/lib/activity-types";

// 19 Supported Event Types for Notifications (as per STEP 51 spec)
const SUPPORTED_NOTIFICATION_EVENTS = [
  EVENT_TYPES.EXECUTIVE_SUMMARY_GENERATED,
  EVENT_TYPES.EXECUTIVE_SUMMARY_EXPORTED,
  EVENT_TYPES.EXEC_SUMMARY_EXPORTED_DOCX,
  EVENT_TYPES.EXEC_SUMMARY_COMPARED,
  EVENT_TYPES.EXEC_SUMMARY_COMPARED_EXPORTED,
  "comparison_matrix_recomputed", // SCORING_MATRIX_RECOMPUTED
  "comparison_matrix_exported", // SCORING_MATRIX_EXPORTED
  "award_previewed", // AWARD_PREVIEWED
  "award_committed", // AWARD_COMMITTED
  "award_pdf_exported", // AWARD_PDF_EXPORTED
  EVENT_TYPES.AWARD_EXPORTED_DOCX,
  EVENT_TYPES.SUPPLIER_DEBRIEF_EXPORTED,
  EVENT_TYPES.SUPPLIER_DEBRIEF_EXPORTED_DOCX,
  EVENT_TYPES.SUPPLIER_OUTCOMES_VIEWED,
  EVENT_TYPES.PORTFOLIO_INSIGHTS_VIEWED,
  EVENT_TYPES.COMPLIANCE_PACK_EXPORTED_PDF,
  EVENT_TYPES.COMPLIANCE_PACK_EXPORTED_DOCX,
  EVENT_TYPES.RFP_ARCHIVED,
  EVENT_TYPES.MULTI_RFP_COMPARE_RUN,
];

// Notification data interface
export interface NotificationItem {
  id: string;
  eventType: string;
  description: string;
  rfpId: string | null;
  rfpTitle: string | null;
  timestamp: Date;
  category: string;
}

export interface NotificationFeedData {
  notifications: NotificationItem[];
  total: number;
}

/**
 * Build human-readable description for a notification
 */
function buildNotificationDescription(
  eventType: string,
  rfpTitle: string | null,
  summary: string
): string {
  const rfpTitleText = rfpTitle || "Unknown RFP";
  
  switch (eventType) {
    case EVENT_TYPES.EXECUTIVE_SUMMARY_GENERATED:
      return `Executive Summary generated for ${rfpTitleText}`;
    
    case EVENT_TYPES.EXECUTIVE_SUMMARY_EXPORTED:
      return `Executive Summary exported (PDF) for ${rfpTitleText}`;
    
    case EVENT_TYPES.EXEC_SUMMARY_EXPORTED_DOCX:
      return `Executive Summary exported (Word) for ${rfpTitleText}`;
    
    case EVENT_TYPES.EXEC_SUMMARY_COMPARED:
      return `Executive Summary versions compared for ${rfpTitleText}`;
    
    case EVENT_TYPES.EXEC_SUMMARY_COMPARED_EXPORTED:
      return `Executive Summary comparison exported for ${rfpTitleText}`;
    
    case "comparison_matrix_recomputed":
      return `Scoring Matrix recomputed for ${rfpTitleText}`;
    
    case "comparison_matrix_exported":
      return `Scoring Matrix exported for ${rfpTitleText}`;
    
    case "award_previewed":
      return `Award Decision previewed for ${rfpTitleText}`;
    
    case "award_committed":
      return `Award Decision committed for ${rfpTitleText}`;
    
    case "award_pdf_exported":
      return `Award Decision PDF exported for ${rfpTitleText}`;
    
    case EVENT_TYPES.AWARD_EXPORTED_DOCX:
      return `Award Decision exported (Word) for ${rfpTitleText}`;
    
    case EVENT_TYPES.SUPPLIER_DEBRIEF_EXPORTED:
      return `Supplier Debrief Pack exported for ${rfpTitleText}`;
    
    case EVENT_TYPES.SUPPLIER_DEBRIEF_EXPORTED_DOCX:
      return `Supplier Debrief Pack exported (Word) for ${rfpTitleText}`;
    
    case EVENT_TYPES.SUPPLIER_OUTCOMES_VIEWED:
      return `Supplier Outcomes Dashboard viewed for ${rfpTitleText}`;
    
    case EVENT_TYPES.PORTFOLIO_INSIGHTS_VIEWED:
      return `Portfolio Insights Dashboard viewed`;
    
    case EVENT_TYPES.COMPLIANCE_PACK_EXPORTED_PDF:
      return `Compliance Pack exported (PDF) for ${rfpTitleText}`;
    
    case EVENT_TYPES.COMPLIANCE_PACK_EXPORTED_DOCX:
      return `Compliance Pack exported (Word) for ${rfpTitleText}`;
    
    case EVENT_TYPES.RFP_ARCHIVED:
      return `RFP archived: ${rfpTitleText}`;
    
    case EVENT_TYPES.MULTI_RFP_COMPARE_RUN:
      return `Multi-RFP Comparison completed`;
    
    default:
      // Fallback to summary if no specific description
      return summary || `Activity recorded for ${rfpTitleText}`;
  }
}

/**
 * Main function to build buyer notifications from activity logs
 * 
 * @param userId - The authenticated buyer's user ID
 * @param companyId - The buyer's company ID (from their RFPs)
 * @returns NotificationFeedData with notifications and total count
 */
export async function buildBuyerNotifications(
  userId: string,
  companyId: string
): Promise<NotificationFeedData> {
  try {
    // Query last 50 activity events matching supported types and company
    const activities = await prisma.activityLog.findMany({
      where: {
        eventType: {
          in: SUPPORTED_NOTIFICATION_EVENTS,
        },
        rfp: {
          companyId: companyId,
        },
      },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Transform activities into notification items
    const notifications: NotificationItem[] = activities.map((activity) => {
      const rfpTitle = activity.rfp?.title || null;
      const description = buildNotificationDescription(
        activity.eventType,
        rfpTitle,
        activity.summary
      );
      const category = getEventCategory(activity.eventType as any);

      return {
        id: activity.id,
        eventType: activity.eventType,
        description,
        rfpId: activity.rfpId,
        rfpTitle,
        timestamp: activity.createdAt,
        category,
      };
    });

    return {
      notifications,
      total: notifications.length,
    };
  } catch (error) {
    console.error("Error building buyer notifications:", error);
    // Return empty feed on error (non-breaking)
    return {
      notifications: [],
      total: 0,
    };
  }
}
