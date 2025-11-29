import { PrismaClient, RFPStage } from '@prisma/client';
import { STAGE_ORDER } from './stages';

const prisma = new PrismaClient();

// Define valid forward transitions
const VALID_FORWARD_TRANSITIONS: Record<string, string[]> = {
  INTAKE: ['QUALIFICATION'],
  QUALIFICATION: ['DISCOVERY'],
  DISCOVERY: ['DRAFTING'],
  DRAFTING: ['PRICING_LEGAL_REVIEW'],
  PRICING_LEGAL_REVIEW: ['EXEC_REVIEW'],
  EXEC_REVIEW: ['SUBMISSION'],
  SUBMISSION: ['DEBRIEF'],
  DEBRIEF: ['ARCHIVED'],
  ARCHIVED: []
};

export interface ValidationResult {
  allowed: boolean;
  reason: string | null;
  warning: string | null;
  requiredTasksIncomplete: string[];
}

/**
 * Get the order position of a stage
 */
export function getStageOrder(stage: string): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Check if transition is a valid forward path (one step)
 */
export function isForwardTransition(oldStage: string, newStage: string): boolean {
  return VALID_FORWARD_TRANSITIONS[oldStage]?.includes(newStage) || false;
}

/**
 * Check if transition is backward in the pipeline
 */
export function isBackwardTransition(oldStage: string, newStage: string): boolean {
  const oldOrder = getStageOrder(oldStage);
  const newOrder = getStageOrder(newStage);
  return newOrder < oldOrder;
}

/**
 * Check if transition skips one or more stages
 */
export function isSkippingStages(oldStage: string, newStage: string): boolean {
  const oldOrder = getStageOrder(oldStage);
  const newOrder = getStageOrder(newStage);
  // Skipping means moving forward but not to the immediate next stage
  return newOrder > oldOrder && !isForwardTransition(oldStage, newStage);
}

/**
 * Main validation function for stage transitions
 */
export async function validateStageTransition(
  oldStage: string | null,
  newStage: string,
  rfpId: string
): Promise<ValidationResult> {
  // If no old stage (new RFP) or same stage, allow
  if (!oldStage || oldStage === newStage) {
    return {
      allowed: true,
      reason: null,
      warning: null,
      requiredTasksIncomplete: []
    };
  }

  // Check if backward transition
  if (isBackwardTransition(oldStage, newStage)) {
    return {
      allowed: true,
      reason: null,
      warning: 'You are moving backward in the pipeline. This may cause process misalignment.',
      requiredTasksIncomplete: []
    };
  }

  // Check if skipping stages
  if (isSkippingStages(oldStage, newStage)) {
    return {
      allowed: true,
      reason: null,
      warning: 'You are skipping required stages in the workflow.',
      requiredTasksIncomplete: []
    };
  }

  // For forward transitions, check incomplete tasks
  if (isForwardTransition(oldStage, newStage)) {
    const incompleteTasks = await prisma.stageTask.findMany({
      where: {
        rfpId,
        stage: oldStage as RFPStage,
        completed: false
      },
      select: {
        title: true
      }
    });

    if (incompleteTasks.length > 0) {
      return {
        allowed: false,
        reason: 'There are incomplete tasks for this stage.',
        warning: 'There are incomplete tasks for this stage.',
        requiredTasksIncomplete: incompleteTasks.map(t => t.title)
      };
    }

    // All tasks complete, allow forward transition
    return {
      allowed: true,
      reason: null,
      warning: null,
      requiredTasksIncomplete: []
    };
  }

  // Any other transition type (should not reach here normally)
  return {
    allowed: true,
    reason: null,
    warning: null,
    requiredTasksIncomplete: []
  };
}
