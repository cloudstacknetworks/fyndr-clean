import { prisma } from './prisma';
import { RFPStage } from '@prisma/client';

// Define automation rules for each stage
const STAGE_AUTOMATIONS: Record<RFPStage, string[]> = {
  INTAKE: [],
  QUALIFICATION: ['Prepare Qualification Briefing Notes'],
  DISCOVERY: ['Set up Discovery Workshop'],
  DRAFTING: ['Assemble Drafting Team'],
  PRICING_LEGAL_REVIEW: [],
  EXEC_REVIEW: ['Prepare Executive Review Packet'],
  SUBMISSION: ['Verify Final Submission Checklist'],
  DEBRIEF: [],
  ARCHIVED: []
};

// Normalize task title for deduplication
function normalizeTaskTitle(title: string): string {
  return title.toLowerCase().trim();
}

// Get automation tasks for a stage
export function getStageAutomationTasks(stage: RFPStage): string[] {
  return STAGE_AUTOMATIONS[stage] || [];
}

// Run stage automations
export async function runStageAutomations({
  rfpId,
  newStage
}: {
  rfpId: string;
  newStage: RFPStage;
}): Promise<void> {
  // Get automation tasks for this stage
  const automationTasks = getStageAutomationTasks(newStage);
  
  if (automationTasks.length === 0) {
    return; // No automations for this stage
  }
  
  // Get existing tasks for this RFP and stage
  const existingTasks = await prisma.stageTask.findMany({
    where: {
      rfpId,
      stage: newStage
    }
  });
  
  // Build set of existing task titles (normalized)
  const existingTitles = new Set(
    existingTasks.map(t => normalizeTaskTitle(t.title))
  );
  
  // Filter out tasks that already exist
  const tasksToCreate = automationTasks.filter(
    title => !existingTitles.has(normalizeTaskTitle(title))
  );
  
  if (tasksToCreate.length === 0) {
    return; // All automation tasks already exist
  }
  
  // Create new automation tasks
  await prisma.stageTask.createMany({
    data: tasksToCreate.map(title => ({
      rfpId,
      stage: newStage,
      title,
      completed: false
    }))
  });
}

// Check if a task is an automation task
export function isAutomationTask(title: string, stage: RFPStage): boolean {
  const automationTasks = getStageAutomationTasks(stage);
  const normalizedTitle = normalizeTaskTitle(title);
  return automationTasks.some(
    autoTask => normalizeTaskTitle(autoTask) === normalizedTitle
  );
}
