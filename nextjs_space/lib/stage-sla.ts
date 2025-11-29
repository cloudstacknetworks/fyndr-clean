import { RFPStage, RFP } from '@prisma/client';

// Default SLA days for each stage
const STAGE_SLA_DAYS: Record<RFPStage, number | null> = {
  INTAKE: 3,
  QUALIFICATION: 5,
  DISCOVERY: 7,
  DRAFTING: 10,
  PRICING_LEGAL_REVIEW: 5,
  EXEC_REVIEW: 3,
  SUBMISSION: 2,
  DEBRIEF: 5,
  ARCHIVED: null
};

// Get SLA days for a stage
export function getSlaForStage(stage: RFPStage): number | null {
  return STAGE_SLA_DAYS[stage];
}

// Calculate days in current stage
export function calculateDaysInStage(rfp: Pick<RFP, 'enteredStageAt' | 'stageEnteredAt'>): number {
  const enteredAt = rfp.enteredStageAt || rfp.stageEnteredAt;
  
  if (!enteredAt) {
    return 0;
  }
  
  const now = new Date();
  const entered = new Date(enteredAt);
  const diffMs = now.getTime() - entered.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Check if SLA is breached
export function isSlaBreached(rfp: Pick<RFP, 'stage' | 'enteredStageAt' | 'stageEnteredAt' | 'stageSlaDays'>): boolean {
  const sla = rfp.stageSlaDays || getSlaForStage(rfp.stage);
  
  if (sla === null) {
    return false;
  }
  
  const daysInStage = calculateDaysInStage(rfp);
  return daysInStage >= sla;
}

// Get SLA status with details
export function getSlaStatus(rfp: Pick<RFP, 'stage' | 'enteredStageAt' | 'stageEnteredAt' | 'stageSlaDays'>): {
  status: 'ok' | 'warning' | 'breached';
  daysInStage: number;
  sla: number | null;
} {
  const sla = rfp.stageSlaDays || getSlaForStage(rfp.stage);
  const daysInStage = calculateDaysInStage(rfp);
  
  if (sla === null) {
    return {
      status: 'ok',
      daysInStage,
      sla
    };
  }
  
  // Status rules:
  // OK: daysInStage < (sla * 0.75)
  // Warning: daysInStage >= (sla * 0.75) AND < sla
  // Breached: daysInStage >= sla
  
  if (daysInStage >= sla) {
    return {
      status: 'breached',
      daysInStage,
      sla
    };
  }
  
  if (daysInStage >= sla * 0.75) {
    return {
      status: 'warning',
      daysInStage,
      sla
    };
  }
  
  return {
    status: 'ok',
    daysInStage,
    sla
  };
}
