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
  
  // STEP 40: Executive Summary Events
  | "EXECUTIVE_SUMMARY_GENERATED"
  | "EXECUTIVE_SUMMARY_EDITED"
  | "EXECUTIVE_SUMMARY_FINALIZED"
  | "EXECUTIVE_SUMMARY_CLONED"
  | "EXECUTIVE_SUMMARY_DELETED"
  | "EXECUTIVE_SUMMARY_EXPORTED"
  | "EXEC_SUMMARY_EXPORTED_DOCX"
  | "EXEC_SUMMARY_COMPARED"
  | "EXEC_SUMMARY_COMPARED_EXPORTED"
  
  // STEP 41: Award Events
  | "award_previewed"
  | "award_committed"
  | "award_pdf_exported"
  | "award_status_changed"
  | "AWARD_EXPORTED_DOCX"
  
  // STEP 42: Supplier Debrief Events
  | "SUPPLIER_DEBRIEF_EXPORTED"
  | "SUPPLIER_DEBRIEF_EXPORTED_DOCX"
  
  // STEP 43: Supplier Outcome Dashboard Events
  | "SUPPLIER_OUTCOMES_VIEWED"
  | "SUPPLIER_OUTCOMES_EXPORTED"
  
  // STEP 44: Portfolio Insights Dashboard Events
  | "PORTFOLIO_INSIGHTS_VIEWED"
  | "PORTFOLIO_INSIGHTS_EXPORTED"
  
  // STEP 47: RFP Archive and Compliance Pack Events
  | "RFP_ARCHIVE_PREVIEWED"
  | "RFP_ARCHIVED"
  | "COMPLIANCE_PACK_EXPORTED_PDF"
  | "COMPLIANCE_PACK_EXPORTED_DOCX"
  
  // STEP 48: Global Search Events
  | "GLOBAL_SEARCH_PERFORMED"
  | "GLOBAL_SEARCH_VIEWED_RESULTS"
  
  // STEP 49: Multi-RFP Comparison Events
  | "MULTI_RFP_COMPARE_RUN"
  | "MULTI_RFP_COMPARE_EXPORTED_PDF"
  | "MULTI_RFP_COMPARE_EXPORTED_DOCX"
  
  // STEP 50: Home Dashboard Events
  | "HOME_DASHBOARD_VIEWED"
  
  // STEP 51: Global Notifications Center Events
  | "NOTIFICATIONS_VIEWED"
  
  // STEP 52: Email Digest Events
  | "DIGEST_EMAIL_PREVIEWED"
  
  // STEP 53: Admin Settings Events
  | "SETTINGS_COMPANY_UPDATED"
  | "SETTINGS_USER_INVITED"
  | "SETTINGS_USER_ROLE_CHANGED"
  | "SETTINGS_USER_DEACTIVATED"
  | "SETTINGS_PREFERENCES_UPDATED"
  
  // STEP 54: Supplier Work Inbox Events
  | "SUPPLIER_INBOX_VIEWED"
  
  // STEP 55: Timeline Automation Events
  | "TIMELINE_AUTOMATION_RUN"
  
  // STEP 56: Company-Level RFP Master Template Library Events
  | "TEMPLATE_CREATED"
  | "TEMPLATE_UPDATED"
  | "TEMPLATE_DELETED"
  | "TEMPLATE_DUPLICATED"
  | "TEMPLATE_CLONED"
  | "TEMPLATE_VERSION_CREATED"
  | "TEMPLATE_VIEWED"
  | "TEMPLATE_LIBRARY_VIEWED"
  | "TEMPLATE_APPLIED_TO_RFP"
  | "TEMPLATE_USED_FOR_NEW_RFP"
  
  // STEP 57: Company-Level Master Requirements Library Events
  | "REQUIREMENT_CREATED"
  | "REQUIREMENT_UPDATED"
  | "REQUIREMENT_ARCHIVED"
  | "REQUIREMENT_CLONED"
  | "REQUIREMENT_VERSION_CREATED"
  | "REQUIREMENT_INSERTED_INTO_RFP"
  | "REQUIREMENT_INSERTED_INTO_TEMPLATE"
  
  // STEP 58: Scoring Matrix Template Library Events
  | "SCORING_TEMPLATE_CREATED"
  | "SCORING_TEMPLATE_UPDATED"
  | "SCORING_TEMPLATE_ARCHIVED"
  | "SCORING_TEMPLATE_CLONED"
  | "SCORING_TEMPLATE_VERSION_CREATED"
  | "SCORING_TEMPLATE_INSERTED_INTO_RFP"
  | "SCORING_TEMPLATE_INSERTED_INTO_RFP_TEMPLATE"
  
  // STEP 59: Auto-Scoring Engine Events
  | "AUTO_SCORE_RUN"
  | "AUTO_SCORE_REGENERATED"
  | "AUTO_SCORE_OVERRIDDEN"
  | "AUTO_SCORE_AI_FAILURE"
  
  // STEP 61: Buyer Evaluation Workspace Events
  | "SCORE_OVERRIDE_APPLIED"
  | "SCORE_OVERRIDE_CLEARED"
  | "EVALUATOR_COMMENT_ADDED"
  
  // STEP 62: Supplier Portal Enhancements Events
  | "SUPPLIER_RFP_LIST_VIEWED"
  | "SUPPLIER_RFP_DETAIL_VIEWED"
  | "SUPPLIER_SUBMISSION_PREVIEW_VIEWED"
  | "SUPPLIER_RFP_OUTCOME_VIEWED"
  | "EVALUATION_VIEWED"
  | "EVALUATION_EXPORTED_PDF"
  | "EVALUATION_EXPORTED_DOCX"
  
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
  
  // STEP 40: Executive Summary Events
  EXECUTIVE_SUMMARY_GENERATED: "EXECUTIVE_SUMMARY_GENERATED" as ActivityEventType,
  EXECUTIVE_SUMMARY_EDITED: "EXECUTIVE_SUMMARY_EDITED" as ActivityEventType,
  EXECUTIVE_SUMMARY_FINALIZED: "EXECUTIVE_SUMMARY_FINALIZED" as ActivityEventType,
  EXECUTIVE_SUMMARY_CLONED: "EXECUTIVE_SUMMARY_CLONED" as ActivityEventType,
  EXECUTIVE_SUMMARY_DELETED: "EXECUTIVE_SUMMARY_DELETED" as ActivityEventType,
  EXECUTIVE_SUMMARY_EXPORTED: "EXECUTIVE_SUMMARY_EXPORTED" as ActivityEventType,
  EXEC_SUMMARY_EXPORTED_DOCX: "EXEC_SUMMARY_EXPORTED_DOCX" as ActivityEventType,
  EXEC_SUMMARY_COMPARED: "EXEC_SUMMARY_COMPARED" as ActivityEventType,
  EXEC_SUMMARY_COMPARED_EXPORTED: "EXEC_SUMMARY_COMPARED_EXPORTED" as ActivityEventType,
  
  // STEP 41: Award Events
  AWARD_PREVIEWED: "award_previewed" as ActivityEventType,
  AWARD_COMMITTED: "award_committed" as ActivityEventType,
  AWARD_PDF_EXPORTED: "award_pdf_exported" as ActivityEventType,
  AWARD_STATUS_CHANGED: "award_status_changed" as ActivityEventType,
  AWARD_EXPORTED_DOCX: "AWARD_EXPORTED_DOCX" as ActivityEventType,
  
  // STEP 42: Supplier Debrief Events
  SUPPLIER_DEBRIEF_EXPORTED: "SUPPLIER_DEBRIEF_EXPORTED" as ActivityEventType,
  SUPPLIER_DEBRIEF_EXPORTED_DOCX: "SUPPLIER_DEBRIEF_EXPORTED_DOCX" as ActivityEventType,
  
  // STEP 43: Supplier Outcome Dashboard Events
  SUPPLIER_OUTCOMES_VIEWED: "SUPPLIER_OUTCOMES_VIEWED" as ActivityEventType,
  SUPPLIER_OUTCOMES_EXPORTED: "SUPPLIER_OUTCOMES_EXPORTED" as ActivityEventType,
  
  // STEP 44: Portfolio Insights Dashboard Events
  PORTFOLIO_INSIGHTS_VIEWED: "PORTFOLIO_INSIGHTS_VIEWED" as ActivityEventType,
  PORTFOLIO_INSIGHTS_EXPORTED: "PORTFOLIO_INSIGHTS_EXPORTED" as ActivityEventType,
  
  // STEP 47: RFP Archive and Compliance Pack Events
  RFP_ARCHIVE_PREVIEWED: "RFP_ARCHIVE_PREVIEWED" as ActivityEventType,
  RFP_ARCHIVED: "RFP_ARCHIVED" as ActivityEventType,
  COMPLIANCE_PACK_EXPORTED_PDF: "COMPLIANCE_PACK_EXPORTED_PDF" as ActivityEventType,
  COMPLIANCE_PACK_EXPORTED_DOCX: "COMPLIANCE_PACK_EXPORTED_DOCX" as ActivityEventType,
  
  // STEP 48: Global Search Events
  GLOBAL_SEARCH_PERFORMED: "GLOBAL_SEARCH_PERFORMED" as ActivityEventType,
  GLOBAL_SEARCH_VIEWED_RESULTS: "GLOBAL_SEARCH_VIEWED_RESULTS" as ActivityEventType,
  
  // STEP 49: Multi-RFP Comparison Events
  MULTI_RFP_COMPARE_RUN: "MULTI_RFP_COMPARE_RUN" as ActivityEventType,
  MULTI_RFP_COMPARE_EXPORTED_PDF: "MULTI_RFP_COMPARE_EXPORTED_PDF" as ActivityEventType,
  MULTI_RFP_COMPARE_EXPORTED_DOCX: "MULTI_RFP_COMPARE_EXPORTED_DOCX" as ActivityEventType,
  
  // STEP 50: Home Dashboard Events
  HOME_DASHBOARD_VIEWED: "HOME_DASHBOARD_VIEWED" as ActivityEventType,
  
  // STEP 51: Global Notifications Center Events
  NOTIFICATIONS_VIEWED: "NOTIFICATIONS_VIEWED" as ActivityEventType,
  
  // STEP 52: Email Digest Events
  DIGEST_EMAIL_PREVIEWED: "DIGEST_EMAIL_PREVIEWED" as ActivityEventType,
  
  // STEP 53: Admin Settings Events
  SETTINGS_COMPANY_UPDATED: "SETTINGS_COMPANY_UPDATED" as ActivityEventType,
  SETTINGS_USER_INVITED: "SETTINGS_USER_INVITED" as ActivityEventType,
  SETTINGS_USER_ROLE_CHANGED: "SETTINGS_USER_ROLE_CHANGED" as ActivityEventType,
  SETTINGS_USER_DEACTIVATED: "SETTINGS_USER_DEACTIVATED" as ActivityEventType,
  SETTINGS_PREFERENCES_UPDATED: "SETTINGS_PREFERENCES_UPDATED" as ActivityEventType,
  
  // STEP 54: Supplier Work Inbox Events
  SUPPLIER_INBOX_VIEWED: "SUPPLIER_INBOX_VIEWED" as ActivityEventType,
  
  // STEP 55: Timeline Automation Events
  TIMELINE_AUTOMATION_RUN: "TIMELINE_AUTOMATION_RUN" as ActivityEventType,
  
  // STEP 56: Company-Level RFP Master Template Library Events
  TEMPLATE_CREATED: "TEMPLATE_CREATED" as ActivityEventType,
  TEMPLATE_UPDATED: "TEMPLATE_UPDATED" as ActivityEventType,
  TEMPLATE_DELETED: "TEMPLATE_DELETED" as ActivityEventType,
  TEMPLATE_DUPLICATED: "TEMPLATE_DUPLICATED" as ActivityEventType,
  TEMPLATE_CLONED: "TEMPLATE_CLONED" as ActivityEventType,
  TEMPLATE_VERSION_CREATED: "TEMPLATE_VERSION_CREATED" as ActivityEventType,
  TEMPLATE_VIEWED: "TEMPLATE_VIEWED" as ActivityEventType,
  TEMPLATE_LIBRARY_VIEWED: "TEMPLATE_LIBRARY_VIEWED" as ActivityEventType,
  TEMPLATE_APPLIED_TO_RFP: "TEMPLATE_APPLIED_TO_RFP" as ActivityEventType,
  TEMPLATE_USED_FOR_NEW_RFP: "TEMPLATE_USED_FOR_NEW_RFP" as ActivityEventType,
  
  // STEP 57: Company-Level Master Requirements Library Events
  REQUIREMENT_CREATED: "REQUIREMENT_CREATED" as ActivityEventType,
  REQUIREMENT_UPDATED: "REQUIREMENT_UPDATED" as ActivityEventType,
  REQUIREMENT_ARCHIVED: "REQUIREMENT_ARCHIVED" as ActivityEventType,
  REQUIREMENT_CLONED: "REQUIREMENT_CLONED" as ActivityEventType,
  REQUIREMENT_VERSION_CREATED: "REQUIREMENT_VERSION_CREATED" as ActivityEventType,
  REQUIREMENT_INSERTED_INTO_RFP: "REQUIREMENT_INSERTED_INTO_RFP" as ActivityEventType,
  REQUIREMENT_INSERTED_INTO_TEMPLATE: "REQUIREMENT_INSERTED_INTO_TEMPLATE" as ActivityEventType,
  
  // STEP 58: Scoring Matrix Template Library Events
  SCORING_TEMPLATE_CREATED: "SCORING_TEMPLATE_CREATED" as ActivityEventType,
  SCORING_TEMPLATE_UPDATED: "SCORING_TEMPLATE_UPDATED" as ActivityEventType,
  SCORING_TEMPLATE_ARCHIVED: "SCORING_TEMPLATE_ARCHIVED" as ActivityEventType,
  SCORING_TEMPLATE_CLONED: "SCORING_TEMPLATE_CLONED" as ActivityEventType,
  SCORING_TEMPLATE_VERSION_CREATED: "SCORING_TEMPLATE_VERSION_CREATED" as ActivityEventType,
  SCORING_TEMPLATE_INSERTED_INTO_RFP: "SCORING_TEMPLATE_INSERTED_INTO_RFP" as ActivityEventType,
  SCORING_TEMPLATE_INSERTED_INTO_RFP_TEMPLATE: "SCORING_TEMPLATE_INSERTED_INTO_RFP_TEMPLATE" as ActivityEventType,
  
  // STEP 59: Auto-Scoring Engine Events
  AUTO_SCORE_RUN: "AUTO_SCORE_RUN" as ActivityEventType,
  AUTO_SCORE_REGENERATED: "AUTO_SCORE_REGENERATED" as ActivityEventType,
  AUTO_SCORE_OVERRIDDEN: "AUTO_SCORE_OVERRIDDEN" as ActivityEventType,
  AUTO_SCORE_AI_FAILURE: "AUTO_SCORE_AI_FAILURE" as ActivityEventType,
  
  // STEP 61: Buyer Evaluation Workspace Events
  SCORE_OVERRIDE_APPLIED: "SCORE_OVERRIDE_APPLIED" as ActivityEventType,
  SCORE_OVERRIDE_CLEARED: "SCORE_OVERRIDE_CLEARED" as ActivityEventType,
  EVALUATOR_COMMENT_ADDED: "EVALUATOR_COMMENT_ADDED" as ActivityEventType,
  EVALUATION_VIEWED: "EVALUATION_VIEWED" as ActivityEventType,
  EVALUATION_EXPORTED_PDF: "EVALUATION_EXPORTED_PDF" as ActivityEventType,
  EVALUATION_EXPORTED_DOCX: "EVALUATION_EXPORTED_DOCX" as ActivityEventType,
  
  // STEP 62: Supplier Portal Enhancements Events
  SUPPLIER_RFP_LIST_VIEWED: "SUPPLIER_RFP_LIST_VIEWED" as ActivityEventType,
  SUPPLIER_RFP_DETAIL_VIEWED: "SUPPLIER_RFP_DETAIL_VIEWED" as ActivityEventType,
  SUPPLIER_SUBMISSION_PREVIEW_VIEWED: "SUPPLIER_SUBMISSION_PREVIEW_VIEWED" as ActivityEventType,
  SUPPLIER_RFP_OUTCOME_VIEWED: "SUPPLIER_RFP_OUTCOME_VIEWED" as ActivityEventType,
  
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
  EXECUTIVE_SUMMARY: "EXECUTIVE_SUMMARY",
  AWARD: "AWARD",
  ARCHIVE: "ARCHIVE",
  SEARCH: "SEARCH",
  COMPARISON: "COMPARISON",
  DASHBOARD: "DASHBOARD",
  DIGEST: "DIGEST",
  SETTINGS: "SETTINGS",
  AUTOMATION: "AUTOMATION",
  TEMPLATE: "TEMPLATE",
  REQUIREMENT: "REQUIREMENT",
  SCORING_TEMPLATE: "SCORING_TEMPLATE",
  SCORING: "SCORING",
};

// Map event types to categories
export function getEventCategory(eventType: ActivityEventType): string {
  // Check archive events first (more specific)
  if (eventType.startsWith("RFP_ARCHIVE") || eventType.startsWith("COMPLIANCE_PACK_")) {
    return EVENT_CATEGORIES.ARCHIVE;
  }
  if (eventType.startsWith("GLOBAL_SEARCH_")) {
    return EVENT_CATEGORIES.SEARCH;
  }
  if (eventType.startsWith("MULTI_RFP_COMPARE_")) {
    return EVENT_CATEGORIES.COMPARISON;
  }
  if (eventType.startsWith("HOME_DASHBOARD_")) {
    return EVENT_CATEGORIES.DASHBOARD;
  }
  if (eventType.startsWith("DIGEST_")) {
    return EVENT_CATEGORIES.DIGEST;
  }
  if (eventType.startsWith("SETTINGS_")) {
    return EVENT_CATEGORIES.SETTINGS;
  }
  if (eventType.startsWith("TIMELINE_AUTOMATION_")) {
    return EVENT_CATEGORIES.AUTOMATION;
  }
  if (eventType.startsWith("TEMPLATE_")) {
    return EVENT_CATEGORIES.TEMPLATE;
  }
  if (eventType.startsWith("REQUIREMENT_")) {
    return EVENT_CATEGORIES.REQUIREMENT;
  }
  if (eventType.startsWith("SCORING_TEMPLATE_")) {
    return EVENT_CATEGORIES.SCORING_TEMPLATE;
  }
  if (eventType.startsWith("AUTO_SCORE_")) {
    return EVENT_CATEGORIES.SCORING;
  }
  if (eventType.startsWith("RFP_")) return EVENT_CATEGORIES.RFP;
  if (eventType.startsWith("SUPPLIER_CONTACT_") || eventType.startsWith("SUPPLIER_INVITATION_") || eventType.startsWith("SUPPLIER_PORTAL_")) {
    return EVENT_CATEGORIES.SUPPLIER_PORTAL;
  }
  if (eventType.startsWith("SUPPLIER_RESPONSE_") || eventType.startsWith("SUPPLIER_ATTACHMENT_")) {
    return EVENT_CATEGORIES.SUPPLIER_RESPONSE;
  }
  if (eventType.startsWith("AI_") || eventType.startsWith("COMPARISON_") || eventType.startsWith("READINESS_") || eventType.startsWith("DECISION_BRIEF_")) {
    return EVENT_CATEGORIES.AI_PROCESSING;
  }
  if (eventType.startsWith("EXECUTIVE_SUMMARY_")) {
    return EVENT_CATEGORIES.EXECUTIVE_SUMMARY;
  }
  if (eventType.startsWith("award_")) {
    return EVENT_CATEGORIES.AWARD;
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
    case EVENT_CATEGORIES.EXECUTIVE_SUMMARY:
      return { bg: "bg-orange-100", text: "text-orange-700" };
    case EVENT_CATEGORIES.AWARD:
      return { bg: "bg-emerald-100", text: "text-emerald-700" };
    case EVENT_CATEGORIES.ARCHIVE:
      return { bg: "bg-slate-100", text: "text-slate-700" };
    case EVENT_CATEGORIES.SEARCH:
      return { bg: "bg-cyan-100", text: "text-cyan-700" };
    case EVENT_CATEGORIES.COMPARISON:
      return { bg: "bg-fuchsia-100", text: "text-fuchsia-700" };
    case EVENT_CATEGORIES.DASHBOARD:
      return { bg: "bg-teal-100", text: "text-teal-700" };
    case EVENT_CATEGORIES.DIGEST:
      return { bg: "bg-violet-100", text: "text-violet-700" };
    case EVENT_CATEGORIES.SETTINGS:
      return { bg: "bg-rose-100", text: "text-rose-700" };
    case EVENT_CATEGORIES.AUTOMATION:
      return { bg: "bg-indigo-100", text: "text-indigo-700" };
    case EVENT_CATEGORIES.TEMPLATE:
      return { bg: "bg-lime-100", text: "text-lime-700" };
    case EVENT_CATEGORIES.REQUIREMENT:
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case EVENT_CATEGORIES.SCORING_TEMPLATE:
      return { bg: "bg-pink-100", text: "text-pink-700" };
    case EVENT_CATEGORIES.SCORING:
      return { bg: "bg-sky-100", text: "text-sky-700" };
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
  
  // STEP 40: Executive Summary Events
  EXECUTIVE_SUMMARY_GENERATED: "Executive Summary Generated",
  EXECUTIVE_SUMMARY_EDITED: "Executive Summary Edited",
  EXECUTIVE_SUMMARY_FINALIZED: "Executive Summary Finalized",
  EXECUTIVE_SUMMARY_CLONED: "Executive Summary Cloned",
  EXECUTIVE_SUMMARY_DELETED: "Executive Summary Deleted",
  EXECUTIVE_SUMMARY_EXPORTED: "Executive Summary Exported",
  EXEC_SUMMARY_EXPORTED_DOCX: "Executive Summary Exported (Word)",
  EXEC_SUMMARY_COMPARED: "Executive Summary Versions Compared",
  EXEC_SUMMARY_COMPARED_EXPORTED: "Executive Summary Comparison Exported",
  
  // STEP 41: Award Events
  award_previewed: "Award Decision Previewed",
  award_committed: "Award Decision Committed",
  award_pdf_exported: "Award Decision PDF Exported",
  award_status_changed: "Award Status Changed",
  AWARD_EXPORTED_DOCX: "Award Decision Exported (Word)",
  
  // STEP 42: Supplier Debrief Events
  SUPPLIER_DEBRIEF_EXPORTED: "Supplier Debrief Pack Exported",
  SUPPLIER_DEBRIEF_EXPORTED_DOCX: "Supplier Debrief Pack Exported (Word)",
  
  // STEP 43: Supplier Outcome Dashboard Events
  SUPPLIER_OUTCOMES_VIEWED: "Supplier Outcomes Viewed",
  SUPPLIER_OUTCOMES_EXPORTED: "Supplier Outcomes PDF Exported",
  
  // STEP 44: Portfolio Insights Dashboard Events
  PORTFOLIO_INSIGHTS_VIEWED: "Portfolio Insights Viewed",
  PORTFOLIO_INSIGHTS_EXPORTED: "Portfolio Insights PDF Exported",
  
  // STEP 47: RFP Archive and Compliance Pack Events
  RFP_ARCHIVE_PREVIEWED: "RFP Archive Previewed",
  RFP_ARCHIVED: "RFP Archived",
  COMPLIANCE_PACK_EXPORTED_PDF: "Compliance Pack Exported (PDF)",
  COMPLIANCE_PACK_EXPORTED_DOCX: "Compliance Pack Exported (Word)",
  
  // STEP 48: Global Search Events
  GLOBAL_SEARCH_PERFORMED: "Global Search Performed",
  GLOBAL_SEARCH_VIEWED_RESULTS: "Search Results Viewed",
  
  // STEP 49: Multi-RFP Comparison Events
  MULTI_RFP_COMPARE_RUN: "Multi-RFP Comparison Run",
  MULTI_RFP_COMPARE_EXPORTED_PDF: "Multi-RFP Comparison Exported (PDF)",
  MULTI_RFP_COMPARE_EXPORTED_DOCX: "Multi-RFP Comparison Exported (DOCX)",
  
  // STEP 50: Home Dashboard Events
  HOME_DASHBOARD_VIEWED: "Home Dashboard Viewed",
  
  // STEP 51: Global Notifications Center Events
  NOTIFICATIONS_VIEWED: "Notifications Center Viewed",
  
  // STEP 52: Email Digest Events
  DIGEST_EMAIL_PREVIEWED: "Email Digest Generated",
  
  // STEP 53: Admin Settings Events
  SETTINGS_COMPANY_UPDATED: "Company Settings Updated",
  SETTINGS_USER_INVITED: "User Invited",
  SETTINGS_USER_ROLE_CHANGED: "User Role Changed",
  SETTINGS_USER_DEACTIVATED: "User Deactivated",
  SETTINGS_PREFERENCES_UPDATED: "Preferences Updated",
  
  // STEP 54: Supplier Work Inbox Events
  SUPPLIER_INBOX_VIEWED: "Supplier Work Inbox Viewed",
  
  // STEP 55: Timeline Automation Events
  TIMELINE_AUTOMATION_RUN: "Timeline Automation Run",
  
  // STEP 56: Company-Level RFP Master Template Library Events
  TEMPLATE_CREATED: "Template Created",
  TEMPLATE_UPDATED: "Template Updated",
  TEMPLATE_DELETED: "Template Deleted",
  TEMPLATE_DUPLICATED: "Template Duplicated",
  TEMPLATE_CLONED: "Template Cloned",
  TEMPLATE_VERSION_CREATED: "Template Version Created",
  TEMPLATE_VIEWED: "Template Viewed",
  TEMPLATE_LIBRARY_VIEWED: "Template Library Viewed",
  TEMPLATE_APPLIED_TO_RFP: "Template Applied to RFP",
  TEMPLATE_USED_FOR_NEW_RFP: "Template Used for New RFP",
  
  // STEP 57: Company-Level Master Requirements Library Events
  REQUIREMENT_CREATED: "Requirement Created",
  REQUIREMENT_UPDATED: "Requirement Updated",
  REQUIREMENT_ARCHIVED: "Requirement Archived",
  REQUIREMENT_CLONED: "Requirement Cloned",
  REQUIREMENT_VERSION_CREATED: "Requirement Version Created",
  REQUIREMENT_INSERTED_INTO_RFP: "Requirement Inserted into RFP",
  REQUIREMENT_INSERTED_INTO_TEMPLATE: "Requirement Inserted into Template",
  
  // STEP 58: Scoring Matrix Template Library Events
  SCORING_TEMPLATE_CREATED: "Scoring Template Created",
  SCORING_TEMPLATE_UPDATED: "Scoring Template Updated",
  SCORING_TEMPLATE_ARCHIVED: "Scoring Template Archived",
  SCORING_TEMPLATE_CLONED: "Scoring Template Cloned",
  SCORING_TEMPLATE_VERSION_CREATED: "Scoring Template Version Created",
  SCORING_TEMPLATE_INSERTED_INTO_RFP: "Scoring Template Inserted into RFP",
  SCORING_TEMPLATE_INSERTED_INTO_RFP_TEMPLATE: "Scoring Template Inserted into RFP Template",
  
  // STEP 59: Auto-Scoring Engine Events
  AUTO_SCORE_RUN: "Auto-Score Run",
  AUTO_SCORE_REGENERATED: "Auto-Score Regenerated",
  AUTO_SCORE_OVERRIDDEN: "Auto-Score Overridden",
  AUTO_SCORE_AI_FAILURE: "Auto-Score AI Failure",
  
  // STEP 61: Buyer Evaluation Workspace Events
  SCORE_OVERRIDE_APPLIED: "Score Override Applied",
  SCORE_OVERRIDE_CLEARED: "Score Override Cleared",
  EVALUATOR_COMMENT_ADDED: "Evaluator Comment Added",
  EVALUATION_VIEWED: "Evaluation Viewed",
  EVALUATION_EXPORTED_PDF: "Evaluation Exported to PDF",
  EVALUATION_EXPORTED_DOCX: "Evaluation Exported to DOCX",
  
  // STEP 62: Supplier Portal Enhancements Events
  SUPPLIER_RFP_LIST_VIEWED: "Supplier RFP List Viewed",
  SUPPLIER_RFP_DETAIL_VIEWED: "Supplier RFP Detail Viewed",
  SUPPLIER_SUBMISSION_PREVIEW_VIEWED: "Supplier Submission Preview Viewed",
  SUPPLIER_RFP_OUTCOME_VIEWED: "Supplier RFP Outcome Viewed",
  
  // Supplier Q&A Events
  SUPPLIER_QUESTION_CREATED: "Question Asked",
  SUPPLIER_QUESTION_ANSWERED: "Question Answered",
  SUPPLIER_BROADCAST_CREATED: "Broadcast Message Sent",
  
  // Notification Events
  NOTIFICATION_SENT: "Notification Sent",
  
  // Export Events
  ACTIVITY_EXPORTED_CSV: "Activity Exported to CSV",
};
