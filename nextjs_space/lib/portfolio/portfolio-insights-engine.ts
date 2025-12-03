/**
 * Portfolio Insights Dashboard Engine (STEP 44)
 * 
 * Provides comprehensive portfolio-level analytics across all RFPs for a company.
 * Strictly PRE-AWARD analytics only - no post-award procurement content.
 */

import { prisma } from "@/lib/prisma";

// ========================================
// TypeScript Interfaces
// ========================================

export interface PortfolioInsights {
  companyId: string;
  generatedAt: string; // ISO timestamp
  
  highLevelCounts: {
    totalRfps: number;
    activeRfps: number; // not awarded or cancelled
    awardedRfps: number;
    cancelledRfps: number;
    inPlanning: number;
    inInvitation: number;
    inQA: number;
    inSubmission: number;
    inEvaluation: number;
    inDemo: number;
  };
  
  budgetMetrics: {
    totalBudgetAcrossRfps: number;
    averageBudget: number;
    medianBudget: number;
    highestBudgetRfp: { id: string; title: string; budget: number } | null;
    lowestBudgetRfp: { id: string; title: string; budget: number } | null;
  };
  
  timelineMetrics: {
    averageCycleTime: number; // days
    medianCycleTime: number;
    longestCycleTime: number;
    shortestCycleTime: number;
    cycleTimeByPhase: {
      planning: number;
      invitation: number;
      qa: number;
      submission: number;
      evaluation: number;
      demo: number;
    };
  };
  
  scoringMetrics: {
    averageSupplierScore: number | null;
    averageWeightedScore: number | null;
    scoreDistribution: {
      range90to100: number;
      range80to89: number;
      range70to79: number;
      range60to69: number;
      below60: number;
    };
    mustHaveComplianceRate: number | null; // percentage
  };
  
  supplierParticipation: {
    totalSuppliersParticipating: number;
    participationBySupplier: Array<{
      supplierId: string;
      supplierName: string;
      participationCount: number;
      shortlistedCount: number;
      awardedCount: number;
      declinedCount: number;
    }>;
  };
  
  portfolioInsights: string[]; // 4-6 algorithmic narratives
}

// ========================================
// Main Function
// ========================================

export async function buildPortfolioInsights(
  companyId: string,
  userId: string
): Promise<PortfolioInsights> {
  try {
    // Fetch all RFPs for the company/user
    const rfps = await prisma.rFP.findMany({
      where: { userId },
      include: {
        company: true,
        supplier: true,
        supplierContacts: {
          include: {
            supplierResponse: true,
          },
        },
      },
    });

    // Initialize metrics
    const highLevelCounts = calculateHighLevelCounts(rfps);
    const budgetMetrics = calculateBudgetMetrics(rfps);
    const timelineMetrics = calculateTimelineMetrics(rfps);
    const scoringMetrics = calculateScoringMetrics(rfps);
    const supplierParticipation = calculateSupplierParticipation(rfps);
    const portfolioInsights = generatePortfolioInsights(
      rfps,
      highLevelCounts,
      budgetMetrics,
      timelineMetrics,
      scoringMetrics,
      supplierParticipation
    );

    return {
      companyId,
      generatedAt: new Date().toISOString(),
      highLevelCounts,
      budgetMetrics,
      timelineMetrics,
      scoringMetrics,
      supplierParticipation,
      portfolioInsights,
    };
  } catch (error) {
    console.error("Error building portfolio insights:", error);
    // Return empty insights on error to maintain graceful degradation
    return createEmptyInsights(companyId);
  }
}

// ========================================
// Helper Functions
// ========================================

function calculateHighLevelCounts(rfps: any[]) {
  const counts = {
    totalRfps: rfps.length,
    activeRfps: 0,
    awardedRfps: 0,
    cancelledRfps: 0,
    inPlanning: 0,
    inInvitation: 0,
    inQA: 0,
    inSubmission: 0,
    inEvaluation: 0,
    inDemo: 0,
  };

  rfps.forEach((rfp) => {
    // Count awarded and cancelled from awardStatus
    if (rfp.awardStatus === "awarded" || rfp.awardStatus === "recommended") {
      counts.awardedRfps++;
    } else if (rfp.awardStatus === "cancelled") {
      counts.cancelledRfps++;
    } else {
      counts.activeRfps++;
    }

    // Count by phase from timelineStateSnapshot
    const snapshot = rfp.timelineStateSnapshot as any;
    if (snapshot?.currentPhase?.phaseId) {
      const phase = snapshot.currentPhase.phaseId;
      switch (phase) {
        case "planning":
          counts.inPlanning++;
          break;
        case "invitation":
          counts.inInvitation++;
          break;
        case "qa":
          counts.inQA++;
          break;
        case "submission":
          counts.inSubmission++;
          break;
        case "evaluation":
          counts.inEvaluation++;
          break;
        case "demo":
          counts.inDemo++;
          break;
      }
    }
  });

  return counts;
}

function calculateBudgetMetrics(rfps: any[]) {
  const budgetsWithRfps = rfps
    .filter((rfp) => rfp.budget !== null && rfp.budget > 0)
    .map((rfp) => ({
      id: rfp.id,
      title: rfp.title,
      budget: Number(rfp.budget),
    }));

  if (budgetsWithRfps.length === 0) {
    return {
      totalBudgetAcrossRfps: 0,
      averageBudget: 0,
      medianBudget: 0,
      highestBudgetRfp: null,
      lowestBudgetRfp: null,
    };
  }

  const sortedBudgets = [...budgetsWithRfps].sort((a, b) => a.budget - b.budget);
  const totalBudget = budgetsWithRfps.reduce((sum, rfp) => sum + rfp.budget, 0);
  const averageBudget = totalBudget / budgetsWithRfps.length;
  
  const middleIndex = Math.floor(sortedBudgets.length / 2);
  const medianBudget =
    sortedBudgets.length % 2 === 0
      ? (sortedBudgets[middleIndex - 1].budget + sortedBudgets[middleIndex].budget) / 2
      : sortedBudgets[middleIndex].budget;

  return {
    totalBudgetAcrossRfps: totalBudget,
    averageBudget: Math.round(averageBudget),
    medianBudget: Math.round(medianBudget),
    highestBudgetRfp: sortedBudgets[sortedBudgets.length - 1],
    lowestBudgetRfp: sortedBudgets[0],
  };
}

function calculateTimelineMetrics(rfps: any[]) {
  const cycleTimes: number[] = [];
  const phaseTimesMap: { [key: string]: number[] } = {
    planning: [],
    invitation: [],
    qa: [],
    submission: [],
    evaluation: [],
    demo: [],
  };

  rfps.forEach((rfp) => {
    const createdAt = rfp.createdAt ? new Date(rfp.createdAt) : null;
    const awardDecidedAt = rfp.awardDecidedAt ? new Date(rfp.awardDecidedAt) : null;
    const endDate = awardDecidedAt || new Date();

    if (createdAt) {
      const cycleTimeDays = Math.floor((endDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (cycleTimeDays >= 0) {
        cycleTimes.push(cycleTimeDays);
      }
    }

    // Extract phase-specific times from timelineStateSnapshot if available
    const snapshot = rfp.timelineStateSnapshot as any;
    if (snapshot?.upcomingPhases) {
      snapshot.upcomingPhases.forEach((phase: any) => {
        if (phase.phaseId && phaseTimesMap[phase.phaseId]) {
          // Estimate phase duration (simplified)
          const duration = phase.estimatedDuration || 7;
          phaseTimesMap[phase.phaseId].push(duration);
        }
      });
    }
  });

  // Calculate average for each phase
  const cycleTimeByPhase = {
    planning: average(phaseTimesMap.planning) || 0,
    invitation: average(phaseTimesMap.invitation) || 0,
    qa: average(phaseTimesMap.qa) || 0,
    submission: average(phaseTimesMap.submission) || 0,
    evaluation: average(phaseTimesMap.evaluation) || 0,
    demo: average(phaseTimesMap.demo) || 0,
  };

  if (cycleTimes.length === 0) {
    return {
      averageCycleTime: 0,
      medianCycleTime: 0,
      longestCycleTime: 0,
      shortestCycleTime: 0,
      cycleTimeByPhase,
    };
  }

  cycleTimes.sort((a, b) => a - b);
  const middleIndex = Math.floor(cycleTimes.length / 2);
  const medianCycleTime =
    cycleTimes.length % 2 === 0
      ? (cycleTimes[middleIndex - 1] + cycleTimes[middleIndex]) / 2
      : cycleTimes[middleIndex];

  return {
    averageCycleTime: Math.round(average(cycleTimes) || 0),
    medianCycleTime: Math.round(medianCycleTime),
    longestCycleTime: cycleTimes[cycleTimes.length - 1] || 0,
    shortestCycleTime: cycleTimes[0] || 0,
    cycleTimeByPhase,
  };
}

function calculateScoringMetrics(rfps: any[]) {
  const scores: number[] = [];
  const weightedScores: number[] = [];
  const scoreDistribution = {
    range90to100: 0,
    range80to89: 0,
    range70to79: 0,
    range60to69: 0,
    below60: 0,
  };
  let totalMustHaveChecks = 0;
  let passedMustHaveChecks = 0;

  rfps.forEach((rfp) => {
    const snapshot = rfp.scoringMatrixSnapshot as any;
    if (snapshot?.supplierSummaries) {
      Object.values(snapshot.supplierSummaries).forEach((summary: any) => {
        if (summary.overallScore !== null && summary.overallScore !== undefined) {
          const score = summary.overallScore;
          scores.push(score);

          // Score distribution
          if (score >= 90) scoreDistribution.range90to100++;
          else if (score >= 80) scoreDistribution.range80to89++;
          else if (score >= 70) scoreDistribution.range70to79++;
          else if (score >= 60) scoreDistribution.range60to69++;
          else scoreDistribution.below60++;
        }

        if (summary.weightedScore !== null && summary.weightedScore !== undefined) {
          weightedScores.push(summary.weightedScore);
        }

        if (summary.mustHaveCompliance !== null && summary.mustHaveCompliance !== undefined) {
          totalMustHaveChecks++;
          if (summary.mustHaveCompliance >= 90) {
            passedMustHaveChecks++;
          }
        }
      });
    }
  });

  return {
    averageSupplierScore: scores.length > 0 ? Math.round(average(scores) || 0) : null,
    averageWeightedScore: weightedScores.length > 0 ? Math.round(average(weightedScores) || 0) : null,
    scoreDistribution,
    mustHaveComplianceRate:
      totalMustHaveChecks > 0 ? Math.round((passedMustHaveChecks / totalMustHaveChecks) * 100) : null,
  };
}

function calculateSupplierParticipation(rfps: any[]) {
  const supplierMap = new Map<string, {
    supplierName: string;
    participationCount: number;
    shortlistedCount: number;
    awardedCount: number;
    declinedCount: number;
  }>();

  rfps.forEach((rfp) => {
    // Process supplier contacts for participation
    rfp.supplierContacts?.forEach((contact: any) => {
      const supplierId = contact.organization || contact.email || contact.id;
      const supplierName = contact.name || contact.organization || contact.email || "Unknown Supplier";

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierName,
          participationCount: 0,
          shortlistedCount: 0,
          awardedCount: 0,
          declinedCount: 0,
        });
      }

      const supplierData = supplierMap.get(supplierId)!;
      supplierData.participationCount++;

      // Count based on awardOutcomeStatus
      if (contact.awardOutcomeStatus === "shortlisted") {
        supplierData.shortlistedCount++;
      } else if (contact.awardOutcomeStatus === "recommended") {
        supplierData.awardedCount++;
      } else if (contact.awardOutcomeStatus === "declined") {
        supplierData.declinedCount++;
      }

      // Also check from awardSnapshot
      const awardSnapshot = rfp.awardSnapshot as any;
      if (awardSnapshot?.supplierOutcomes) {
        const outcome = awardSnapshot.supplierOutcomes.find(
          (o: any) => o.supplierContactId === contact.id
        );
        if (outcome?.outcome === "awarded") {
          supplierData.awardedCount++;
        }
      }
    });
  });

  const participationBySupplier = Array.from(supplierMap.entries())
    .map(([supplierId, data]) => ({
      supplierId,
      ...data,
    }))
    .sort((a, b) => b.participationCount - a.participationCount);

  return {
    totalSuppliersParticipating: supplierMap.size,
    participationBySupplier,
  };
}

function generatePortfolioInsights(
  rfps: any[],
  counts: any,
  budget: any,
  timeline: any,
  scoring: any,
  supplier: any
): string[] {
  const insights: string[] = [];

  // Insight 1: Cycle time analysis
  if (timeline.averageCycleTime > 0 && timeline.medianCycleTime > 0) {
    const variance = ((timeline.averageCycleTime - timeline.medianCycleTime) / timeline.medianCycleTime) * 100;
    if (Math.abs(variance) > 10) {
      insights.push(
        `Average RFP cycle time is ${Math.abs(Math.round(variance))}% ${
          variance > 0 ? "above" : "below"
        } median, indicating ${variance > 0 ? "some lengthy outliers" : "generally consistent timelines"}.`
      );
    } else {
      insights.push(
        `RFP cycle times are consistent, with average (${timeline.averageCycleTime} days) close to median (${timeline.medianCycleTime} days).`
      );
    }
  }

  // Insight 2: Supplier participation
  if (supplier.participationBySupplier.length > 0) {
    const topSuppliers = supplier.participationBySupplier.slice(0, 3);
    const topSupplierNames = topSuppliers.map((s: any) => `${s.supplierName} (${s.participationCount} RFPs)`).join(", ");
    insights.push(`Most frequently participating suppliers: ${topSupplierNames}.`);
  }

  // Insight 3: Award analysis
  if (supplier.participationBySupplier.some((s: any) => s.awardedCount > 0)) {
    const topAwardee = supplier.participationBySupplier.reduce((max: any, s: any) =>
      s.awardedCount > max.awardedCount ? s : max
    );
    if (topAwardee.awardedCount > 0) {
      insights.push(
        `Most awarded supplier: ${topAwardee.supplierName} with ${topAwardee.awardedCount} award${
          topAwardee.awardedCount > 1 ? "s" : ""
        }.`
      );
    }
  }

  // Insight 4: Budget analysis
  if (budget.averageBudget > 0) {
    insights.push(
      `Average RFP budget is ${formatCurrency(budget.averageBudget)}, with total portfolio value of ${formatCurrency(
        budget.totalBudgetAcrossRfps
      )}.`
    );
  }

  // Insight 5: Scoring insights
  if (scoring.averageSupplierScore !== null) {
    insights.push(
      `Average supplier score across portfolio is ${scoring.averageSupplierScore}/100${
        scoring.mustHaveComplianceRate !== null
          ? `, with ${scoring.mustHaveComplianceRate}% must-have compliance rate`
          : ""
      }.`
    );
  }

  // Insight 6: Active RFP insights
  if (counts.activeRfps > 0) {
    const activePercentage = Math.round((counts.activeRfps / counts.totalRfps) * 100);
    insights.push(
      `${counts.activeRfps} of ${counts.totalRfps} RFPs (${activePercentage}%) are currently active and in progress.`
    );
  }

  return insights.slice(0, 6); // Return up to 6 insights
}

// ========================================
// Utility Functions
// ========================================

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function createEmptyInsights(companyId: string): PortfolioInsights {
  return {
    companyId,
    generatedAt: new Date().toISOString(),
    highLevelCounts: {
      totalRfps: 0,
      activeRfps: 0,
      awardedRfps: 0,
      cancelledRfps: 0,
      inPlanning: 0,
      inInvitation: 0,
      inQA: 0,
      inSubmission: 0,
      inEvaluation: 0,
      inDemo: 0,
    },
    budgetMetrics: {
      totalBudgetAcrossRfps: 0,
      averageBudget: 0,
      medianBudget: 0,
      highestBudgetRfp: null,
      lowestBudgetRfp: null,
    },
    timelineMetrics: {
      averageCycleTime: 0,
      medianCycleTime: 0,
      longestCycleTime: 0,
      shortestCycleTime: 0,
      cycleTimeByPhase: {
        planning: 0,
        invitation: 0,
        qa: 0,
        submission: 0,
        evaluation: 0,
        demo: 0,
      },
    },
    scoringMetrics: {
      averageSupplierScore: null,
      averageWeightedScore: null,
      scoreDistribution: {
        range90to100: 0,
        range80to89: 0,
        range70to79: 0,
        range60to69: 0,
        below60: 0,
      },
      mustHaveComplianceRate: null,
    },
    supplierParticipation: {
      totalSuppliersParticipating: 0,
      participationBySupplier: [],
    },
    portfolioInsights: [],
  };
}
