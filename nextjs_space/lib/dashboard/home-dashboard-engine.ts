/**
 * STEP 50: Buyer Home Dashboard & Work Queue Engine
 * Core business logic for building the buyer home dashboard
 */

import { prisma } from '@/lib/prisma';
import { RFPStage } from '@prisma/client';

// ========================
// TypeScript Type Definitions
// ========================

export interface HomeDashboardStats {
  activeCount: number;
  dueSoonCount: number;
  inEvaluationCount: number;
  awardedRecentCount: number;
  avgCycleTimeDays: number | null;
}

export interface RfpCardData {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  phase: string;
  awardStatus: string;
  dueDate: Date | null;
  daysUntilDue: number | null;
  daysOverdue: number | null;
  hasDecisionBrief: boolean;
  hasScoringMatrix: boolean;
  hasExecSummary: boolean;
  isAwarded: boolean;
  isArchived: boolean;
  updatedAt: Date;
}

export interface WorkQueueItem {
  rfpId: string;
  title: string;
  dueDate: Date;
  phase: string;
  awardStatus: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface AttentionItem {
  rfpId: string;
  rfpTitle: string;
  type: 'decision_brief' | 'scoring_matrix' | 'exec_summary' | 'award';
  suggestedNextAction: string;
  reason: string;
}

export interface RecentActivityItem {
  rfpId: string;
  title: string;
  lastUpdatedAt: Date;
  indicator: string;
}

export interface HomeDashboardData {
  stats: HomeDashboardStats;
  myRfps: RfpCardData[];
  upcomingDeadlines: WorkQueueItem[];
  attentionItems: AttentionItem[];
  recentActivity: RecentActivityItem[];
}

// ========================
// Helper Functions
// ========================

function derivePhaseFromRfp(rfp: any): string {
  // First check timelineStateSnapshot
  if (rfp.timelineStateSnapshot && typeof rfp.timelineStateSnapshot === 'object') {
    const snapshot = rfp.timelineStateSnapshot as any;
    if (snapshot.currentPhase && snapshot.currentPhase.label) {
      return snapshot.currentPhase.label;
    }
  }
  
  // Fallback to awardStatus
  if (rfp.awardStatus && rfp.awardStatus !== 'not_awarded') {
    if (rfp.awardStatus === 'awarded') return 'Awarded';
    if (rfp.awardStatus === 'recommended') return 'Award Recommended';
    if (rfp.awardStatus === 'cancelled') return 'Cancelled';
  }
  
  // Fallback to stage enum if available
  if (rfp.stage) {
    const stageMap: Record<string, string> = {
      [RFPStage.INTAKE]: 'Intake',
      [RFPStage.QUALIFICATION]: 'Qualification',
      [RFPStage.DISCOVERY]: 'Discovery',
      [RFPStage.DRAFTING]: 'Drafting',
      [RFPStage.PRICING_LEGAL_REVIEW]: 'Pricing/Legal Review',
      [RFPStage.EXEC_REVIEW]: 'Executive Review',
      [RFPStage.SUBMISSION]: 'Submission',
      [RFPStage.DEBRIEF]: 'Debrief',
      [RFPStage.ARCHIVED]: 'Archived',
    };
    return stageMap[rfp.stage] || 'Planning';
  }
  
  return 'Planning';
}

function calculateDaysDiff(date: Date): { daysUntilDue: number | null; daysOverdue: number | null } {
  if (!date) return { daysUntilDue: null, daysOverdue: null };
  
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 0) {
    return { daysUntilDue: diffDays, daysOverdue: null };
  } else {
    return { daysUntilDue: null, daysOverdue: Math.abs(diffDays) };
  }
}

function calculateUrgency(dueDate: Date): 'critical' | 'high' | 'medium' | 'low' {
  const { daysUntilDue, daysOverdue } = calculateDaysDiff(dueDate);
  
  // Overdue or due within 3 days
  if (daysOverdue !== null || (daysUntilDue !== null && daysUntilDue <= 3)) {
    return 'critical';
  }
  
  // Due 4-10 days
  if (daysUntilDue !== null && daysUntilDue >= 4 && daysUntilDue <= 10) {
    return 'high';
  }
  
  // Due 11-20 days
  if (daysUntilDue !== null && daysUntilDue >= 11 && daysUntilDue <= 20) {
    return 'medium';
  }
  
  // Due 21-30 days
  return 'low';
}

// ========================
// Main Engine Function
// ========================

export async function buildBuyerHomeDashboard(
  userId: string,
  companyId: string
): Promise<HomeDashboardData> {
  try {
    // ========================================
    // Step 1: Fetch "My RFPs" (owned by buyer, not archived)
    // ========================================
    const myRfps = await prisma.rFP.findMany({
      where: {
        userId: userId,
        companyId: companyId,
        isArchived: false,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // ========================================
    // Step 2: Derive RFP Cards
    // ========================================
    const rfpCards: RfpCardData[] = myRfps.map((rfp) => {
      const phase = derivePhaseFromRfp(rfp);
      const { daysUntilDue, daysOverdue } = rfp.dueDate ? calculateDaysDiff(rfp.dueDate) : { daysUntilDue: null, daysOverdue: null };
      
      // Check for various completions
      const hasDecisionBrief = rfp.decisionBriefSnapshot !== null && rfp.decisionBriefSnapshot !== undefined;
      const hasScoringMatrix = rfp.scoringMatrixSnapshot !== null && rfp.scoringMatrixSnapshot !== undefined;
      const hasExecSummary = false; // Would need to check ExecutiveSummaryDocument table - simplified for now
      const isAwarded = rfp.awardStatus === 'awarded' || rfp.awardStatus === 'recommended';
      
      return {
        id: rfp.id,
        title: rfp.title,
        description: rfp.description ? rfp.description.substring(0, 100) : null,
        budget: rfp.budget,
        phase,
        awardStatus: rfp.awardStatus || 'not_awarded',
        dueDate: rfp.dueDate,
        daysUntilDue,
        daysOverdue,
        hasDecisionBrief,
        hasScoringMatrix,
        hasExecSummary,
        isAwarded,
        isArchived: rfp.isArchived || false,
        updatedAt: rfp.createdAt, // Using createdAt as RFP doesn't have updatedAt
      };
    });

    // ========================================
    // Step 3: Upcoming Deadlines (Work Queue)
    // ========================================
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingDeadlines: WorkQueueItem[] = myRfps
      .filter((rfp) => {
        if (!rfp.dueDate || rfp.isArchived) return false;
        return rfp.dueDate <= thirtyDaysFromNow;
      })
      .map((rfp) => {
        const phase = derivePhaseFromRfp(rfp);
        const urgency = calculateUrgency(rfp.dueDate!);
        
        return {
          rfpId: rfp.id,
          title: rfp.title,
          dueDate: rfp.dueDate!,
          phase,
          awardStatus: rfp.awardStatus || 'not_awarded',
          urgency,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    // ========================================
    // Step 4: Attention Items (Missing Pieces)
    // ========================================
    const attentionItems: AttentionItem[] = [];
    
    for (const rfp of myRfps) {
      // Skip archived or cancelled RFPs
      if (rfp.isArchived || rfp.awardStatus === 'cancelled') continue;
      
      const hasDecisionBrief = rfp.decisionBriefSnapshot !== null && rfp.decisionBriefSnapshot !== undefined;
      const hasScoringMatrix = rfp.scoringMatrixSnapshot !== null && rfp.scoringMatrixSnapshot !== undefined;
      const isNotAwarded = rfp.awardStatus === 'not_awarded' || !rfp.awardStatus;
      const isPastDue = rfp.dueDate && rfp.dueDate < now;
      
      // No Decision Brief
      if (!hasDecisionBrief) {
        attentionItems.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          type: 'decision_brief',
          suggestedNextAction: 'Create Decision Brief',
          reason: 'No executive decision brief has been created for this RFP yet.',
        });
      }
      
      // No Scoring Matrix
      if (!hasScoringMatrix) {
        attentionItems.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          type: 'scoring_matrix',
          suggestedNextAction: 'Set Up Scoring Matrix',
          reason: 'No scoring matrix has been configured for this RFP.',
        });
      }
      
      // Past due and not awarded
      if (isPastDue && isNotAwarded) {
        attentionItems.push({
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          type: 'award',
          suggestedNextAction: 'Finalize Award Decision',
          reason: 'This RFP is past its due date but no award decision has been made.',
        });
      }
    }

    // ========================================
    // Step 5: Recent Activity
    // ========================================
    const recentActivity: RecentActivityItem[] = myRfps
      .slice(0, 10)
      .map((rfp) => ({
        rfpId: rfp.id,
        title: rfp.title,
        lastUpdatedAt: rfp.createdAt, // Using createdAt as RFP doesn't have updatedAt
        indicator: 'Recently created',
      }));

    // ========================================
    // Step 6: Stats Summary
    // ========================================
    const activeCount = myRfps.length;
    const dueSoonCount = upcomingDeadlines.length;
    
    const inEvaluationCount = myRfps.filter((rfp) => {
      const phase = derivePhaseFromRfp(rfp);
      return phase === 'Evaluation' || phase === 'Demo';
    }).length;
    
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const awardedRecentCount = await prisma.rFP.count({
      where: {
        userId: userId,
        companyId: companyId,
        awardStatus: 'awarded',
        awardDecidedAt: {
          gte: sixMonthsAgo,
        },
      },
    });
    
    // Calculate average cycle time
    let avgCycleTimeDays: number | null = null;
    const completedRfps = myRfps.filter((rfp) => rfp.awardDecidedAt !== null);
    if (completedRfps.length > 0) {
      const totalDays = completedRfps.reduce((sum, rfp) => {
        const cycleTime = Math.ceil(
          (rfp.awardDecidedAt!.getTime() - rfp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + cycleTime;
      }, 0);
      avgCycleTimeDays = Math.round(totalDays / completedRfps.length);
    }

    const stats: HomeDashboardStats = {
      activeCount,
      dueSoonCount,
      inEvaluationCount,
      awardedRecentCount,
      avgCycleTimeDays,
    };

    // ========================================
    // Return Complete Dashboard Data
    // ========================================
    return {
      stats,
      myRfps: rfpCards,
      upcomingDeadlines,
      attentionItems,
      recentActivity,
    };
    
  } catch (error) {
    console.error('[Home Dashboard Engine] Error building dashboard:', error);
    
    // Graceful degradation: return empty dashboard
    return {
      stats: {
        activeCount: 0,
        dueSoonCount: 0,
        inEvaluationCount: 0,
        awardedRecentCount: 0,
        avgCycleTimeDays: null,
      },
      myRfps: [],
      upcomingDeadlines: [],
      attentionItems: [],
      recentActivity: [],
    };
  }
}
