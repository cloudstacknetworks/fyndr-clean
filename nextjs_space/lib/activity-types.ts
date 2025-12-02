/**
 * Activity Log & Audit Trail System (STEP 23)
 * 
 * This file defines all event types, actor roles, and TypeScript types
 * for the centralized activity logging system.
 */

// Actor Roles
export type ActivityActorRole = "BUYER" | "SUPPLIER" | "SYSTEM";

export const ACTOR_ROLES = {
  BUYER: "BUYER" as ActivityActorRole,
  SUPPLIER: "SUPPLIER" as ActivityActorRole,
  SYSTEM: "SYSTEM" as ActivityActorRole,
};

// Event Types
export type ActivityEventType = 
  // RFP Events
  | "RFP_CREATED"
  | "RFP_UPDATED"
  | "RFP_TIMELINE_UPDATED"
  | "RFP_STATUS_CHANGED"
  
  // Supplier Contact / Portal Events
  | "SUPPLIER_CONTACT_CREATED"
  | "SUPPLIER_INVITATION_SENT"
  | "SUPPLIER_PORTAL_ACCESS_GRANTED"
  | "SUPPLIER_PORTAL_LOGIN"
  
  // Supplier Response Events
  | "SUPPLIER_RESPONSE_SAVED_DRAFT"
  | "SUPPLIER_RESPONSE_SUBMITTED"
  | "SUPPLIER_ATTACHMENT_UPLOADED"
  | "SUPPLIER_ATTACHMENT_DELETED"
  | "ATTACHMENT_PREVIEWED"
  
  // AI / Comparison Events
  | "AI_EXTRACTION_RUN"
  | "SUPPLIER_COMPARISON_RUN"
  | "COMPARISON_AI_SUMMARY_RUN"
  | "COMPARISON_NARRATIVE_GENERATED"
  | "COMPARISON_REPORT_GENERATED"
  | "READINESS_RECALCULATED"
  
  // STEP 39: Scoring Matrix Events
  | "comparison_matrix_recomputed"
  | "comparison_matrix_exported"
  
  // Decision Brief Events (STEP 34)
  | "DECISION_BRIEF_AI_GENERATED"
  | "DECISION_BRIEF_PDF_EXPORTED"
  
  // Supplier Q&A Events
  | "SUPPLIER_QUESTION_CREATED"
  | "SUPPLIER_QUESTION_ANSWERED"
  | "SUPPLIER_BROADCAST_CREATED"
  
  // Notification Events
  | "NOTIFICATION_SENT"
  
  // Export Events
  | "ACTIVITY_EXPORTED_CSV";

export const EVENT_TYPES = {
  // RFP Events
  RFP_CREATED: "RFP_CREATED" as ActivityEventType,
  RFP_UPDATED: "RFP_UPDATED" as ActivityEventType,
  RFP_TIMELINE_UPDATED: "RFP_TIMELINE_UPDATED" as ActivityEventType,
  RFP_STATUS_CHANGED: "RFP_STATUS_CHANGED" as ActivityEventType,
  
  // Supplier Contact / Portal Events
  SUPPLIER_CONTACT_CREATED: "SUPPLIER_CONTACT_CREATED" as ActivityEventType,
  SUPPLIER_INVITATION_SENT: "SUPPLIER_INVITATION_SENT" as ActivityEventType,
  SUPPLIER_PORTAL_ACCESS_GRANTED: "SUPPLIER_PORTAL_ACCESS_GRANTED" as ActivityEventType,
  SUPPLIER_PORTAL_LOGIN: "SUPPLIER_PORTAL_LOGIN" as ActivityEventType,
  
  // Supplier Response Events
  SUPPLIER_RESPONSE_SAVED_DRAFT: "SUPPLIER_RESPONSE_SAVED_DRAFT" as ActivityEventType,
  SUPPLIER_RESPONSE_SUBMITTED: "SUPPLIER_RESPONSE_SUBMITTED" as ActivityEventType,
  SUPPLIER_ATTACHMENT_UPLOADED: "SUPPLIER_ATTACHMENT_UPLOADED" as ActivityEventType,
  SUPPLIER_ATTACHMENT_DELETED: "SUPPLIER_ATTACHMENT_DELETED" as ActivityEventType,
  ATTACHMENT_PREVIEWED: "ATTACHMENT_PREVIEWED" as ActivityEventType,
  
  // AI / Comparison Events
  AI_EXTRACTION_RUN: "AI_EXTRACTION_RUN" as ActivityEventType,
  SUPPLIER_COMPARISON_RUN: "SUPPLIER_COMPARISON_RUN" as ActivityEventType,
  COMPARISON_AI_SUMMARY_RUN: "COMPARISON_AI_SUMMARY_RUN" as ActivityEventType,
  COMPARISON_NARRATIVE_GENERATED: "COMPARISON_NARRATIVE_GENERATED" as ActivityEventType,
  COMPARISON_REPORT_GENERATED: "COMPARISON_REPORT_GENERATED" as ActivityEventType,
  READINESS_RECALCULATED: "READINESS_RECALCULATED" as ActivityEventType,
  
  // STEP 39: Scoring Matrix Events
  COMPARISON_MATRIX_RECOMPUTED: "comparison_matrix_recomputed" as ActivityEventType,
  COMPARISON_MATRIX_EXPORTED: "comparison_matrix_exported" as ActivityEventType,
  
  // Decision Brief Events (STEP 34)
  DECISION_BRIEF_AI_GENERATED: "DECISION_BRIEF_AI_GENERATED" as ActivityEventType,
  DECISION_BRIEF_PDF_EXPORTED: "DECISION_BRIEF_PDF_EXPORTED" as ActivityEventType,
  
  // Supplier Q&A Events
  SUPPLIER_QUESTION_CREATED: "SUPPLIER_QUESTION_CREATED" as ActivityEventType,
  SUPPLIER_QUESTION_ANSWERED: "SUPPLIER_QUESTION_ANSWERED" as ActivityEventType,
  SUPPLIER_BROADCAST_CREATED: "SUPPLIER_BROADCAST_CREATED" as ActivityEventType,
  
  // Notification Events
  NOTIFICATION_SENT: "NOTIFICATION_SENT" as ActivityEventType,
  
  // Export Events
  ACTIVITY_EXPORTED_CSV: "ACTIVITY_EXPORTED_CSV" as ActivityEventType,
};

// Event Categories for UI Grouping
export const EVENT_CATEGORIES = {
  RFP: "RFP",
  SUPPLIER_PORTAL: "SUPPLIER_PORTAL",
  SUPPLIER_RESPONSE: "SUPPLIER_RESPONSE",
  AI_PROCESSING: "AI_PROCESSING",
  QA_SYSTEM: "QA_SYSTEM",
  NOTIFICATIONS: "NOTIFICATIONS",
  EXPORT: "EXPORT",
};

// Map event types to categories
export function getEventCategory(eventType: ActivityEventType): string {
  if (eventType.startsWith("RFP_")) return EVENT_CATEGORIES.RFP;
  if (eventType.startsWith("SUPPLIER_CONTACT_") || eventType.startsWith("SUPPLIER_INVITATION_") || eventType.startsWith("SUPPLIER_PORTAL_")) {
    return EVENT_CATEGORIES.SUPPLIER_PORTAL;
  }
  if (eventType.startsWith("SUPPLIER_RESPONSE_") || eventType.startsWith("SUPPLIER_ATTACHMENT_")) {
    return EVENT_CATEGORIES.SUPPLIER_RESPONSE;
  }
  if (eventType.startsWith("AI_") || eventType.startsWith("COMPARISON_") || eventType.startsWith("READINESS_")) {
    return EVENT_CATEGORIES.AI_PROCESSING;
  }
  if (eventType.startsWith("SUPPLIER_QUESTION_") || eventType.startsWith("SUPPLIER_BROADCAST_")) {
    return EVENT_CATEGORIES.QA_SYSTEM;
  }
  if (eventType === "NOTIFICATION_SENT") return EVENT_CATEGORIES.NOTIFICATIONS;
  if (eventType === "ACTIVITY_EXPORTED_CSV") return EVENT_CATEGORIES.EXPORT;
  return "OTHER";
}

// Get color for event type badge (Tailwind CSS classes)
export function getEventTypeColor(eventType: ActivityEventType): { bg: string; text: string } {
  const category = getEventCategory(eventType);
  
  switch (category) {
    case EVENT_CATEGORIES.RFP:
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case EVENT_CATEGORIES.SUPPLIER_PORTAL:
    case EVENT_CATEGORIES.SUPPLIER_RESPONSE:
      return { bg: "bg-green-100", text: "text-green-700" };
    case EVENT_CATEGORIES.AI_PROCESSING:
      return { bg: "bg-purple-100", text: "text-purple-700" };
    case EVENT_CATEGORIES.QA_SYSTEM:
      return { bg: "bg-amber-100", text: "text-amber-700" };
    case EVENT_CATEGORIES.NOTIFICATIONS:
      return { bg: "bg-indigo-100", text: "text-indigo-700" };
    case EVENT_CATEGORIES.EXPORT:
      return { bg: "bg-gray-100", text: "text-gray-700" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}

// Human-readable labels for event types
export const EVENT_TYPE_LABELS: Record<ActivityEventType, string> = {
  // RFP Events
  RFP_CREATED: "RFP Created",
  RFP_UPDATED: "RFP Updated",
  RFP_TIMELINE_UPDATED: "Timeline Updated",
  RFP_STATUS_CHANGED: "Status Changed",
  
  // Supplier Contact / Portal Events
  SUPPLIER_CONTACT_CREATED: "Supplier Contact Created",
  SUPPLIER_INVITATION_SENT: "Invitation Sent",
  SUPPLIER_PORTAL_ACCESS_GRANTED: "Portal Access Granted",
  SUPPLIER_PORTAL_LOGIN: "Supplier Logged In",
  
  // Supplier Response Events
  SUPPLIER_RESPONSE_SAVED_DRAFT: "Response Draft Saved",
  SUPPLIER_RESPONSE_SUBMITTED: "Response Submitted",
  SUPPLIER_ATTACHMENT_UPLOADED: "Attachment Uploaded",
  SUPPLIER_ATTACHMENT_DELETED: "Attachment Deleted",
  ATTACHMENT_PREVIEWED: "Attachment Previewed",
  
  // AI / Comparison Events
  AI_EXTRACTION_RUN: "AI Extraction Completed",
  SUPPLIER_COMPARISON_RUN: "Supplier Comparison Completed",
  COMPARISON_AI_SUMMARY_RUN: "AI Summary Generated",
  COMPARISON_NARRATIVE_GENERATED: "Narrative Generated",
  COMPARISON_REPORT_GENERATED: "Report Generated",
  READINESS_RECALCULATED: "Readiness Recalculated",
  comparison_matrix_recomputed: "Comparison Matrix Recomputed",
  comparison_matrix_exported: "Comparison Matrix Exported",
  
  // Decision Brief Events (STEP 34)
  DECISION_BRIEF_AI_GENERATED: "Decision Brief AI Generated",
  DECISION_BRIEF_PDF_EXPORTED: "Decision Brief PDF Exported",
  
  // Supplier Q&A Events
  SUPPLIER_QUESTION_CREATED: "Question Asked",
  SUPPLIER_QUESTION_ANSWERED: "Question Answered",
  SUPPLIER_BROADCAST_CREATED: "Broadcast Message Sent",
  
  // Notification Events
  NOTIFICATION_SENT: "Notification Sent",
  
  // Export Events
  ACTIVITY_EXPORTED_CSV: "Activity Exported to CSV",
};
