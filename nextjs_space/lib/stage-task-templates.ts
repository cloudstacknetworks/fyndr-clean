/**
 * Stage Task Templates
 * 
 * Defines static template tasks for each RFP stage.
 * These are baseline tasks that apply to most RFPs in a given stage.
 * AI-generated tasks can supplement these with context-specific additions.
 */

export type RFPStage = 
  | 'INTAKE'
  | 'QUALIFICATION'
  | 'DISCOVERY'
  | 'DRAFTING'
  | 'PRICING_LEGAL_REVIEW'
  | 'EXEC_REVIEW'
  | 'SUBMISSION'
  | 'DEBRIEF'
  | 'ARCHIVED';

/**
 * Static task templates for each stage
 */
export const STAGE_TASK_TEMPLATES: Record<RFPStage, string[]> = {
  INTAKE: [
    'Confirm RFP owner and internal sponsor',
    'Log RFP into Fyndr with basic metadata',
    'Attach original RFP documents',
    'Review submission deadline and key dates',
  ],
  QUALIFICATION: [
    'Identify decision maker and economic buyer',
    'Confirm budget range and funding approval path',
    'Validate fit against solution capabilities',
    'Assess win probability and strategic value',
  ],
  DISCOVERY: [
    'Gather detailed requirements from stakeholders',
    'Identify key risks and dependencies',
    'Map current-state vs target-state process',
    'Document client pain points and success criteria',
  ],
  DRAFTING: [
    'Assign authors for each RFP section',
    'Draft initial responses for technical requirements',
    'Review alignment with internal standards and policies',
    'Compile supporting documentation and case studies',
  ],
  PRICING_LEGAL_REVIEW: [
    'Prepare draft pricing and discount structure',
    'Obtain legal review of terms and conditions',
    'Align proposal with commercial policy and guardrails',
    'Finalize contract language and liability clauses',
  ],
  EXEC_REVIEW: [
    'Schedule executive review session',
    'Incorporate feedback from leadership',
    'Confirm final go/no-go decision',
    'Secure executive sponsor approval',
  ],
  SUBMISSION: [
    'Validate all required documents are included',
    'Confirm submission method and deadline',
    'Submit final RFP response and capture confirmation',
    'Notify stakeholders of successful submission',
  ],
  DEBRIEF: [
    'Capture client feedback and outcome',
    'Document lessons learned and gaps',
    'Update win/loss analysis',
    'Share insights with team and archive records',
  ],
  ARCHIVED: [
    'Ensure all final documents are stored centrally',
    'Close out internal tasks and trackers',
    'Archive communication history and artifacts',
  ],
};

/**
 * Get template tasks for a specific stage
 */
export function getStageTemplates(stage: RFPStage): string[] {
  return STAGE_TASK_TEMPLATES[stage] || [];
}

/**
 * Get all template task titles (for deduplication)
 */
export function getAllTemplateTaskTitles(): Set<string> {
  const allTitles = new Set<string>();
  Object.values(STAGE_TASK_TEMPLATES).forEach(tasks => {
    tasks.forEach(title => allTitles.add(title.toLowerCase().trim()));
  });
  return allTitles;
}
