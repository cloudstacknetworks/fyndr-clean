/**
 * Multi-RFP Comparison Engine (STEP 49)
 * 
 * This module provides the core logic for comparing 2-5 RFPs side-by-side,
 * aggregating key metrics, identifying cross-RFP insights, and analyzing
 * supplier participation across multiple procurements.
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// TypeScript Types
// ============================================================================

export interface ComparisonRequest {
  rfpIds: string[];
  companyId: string;
  userId: string;
}

export interface RfpComparisonData {
  rfpId: string;
  title: string;
  budget: number | null;
  createdAt: Date;
  updatedAt: Date;
  supplierCount: number;
  awardStatus: string | null;
  snapshotAvailability: {
    decisionBrief: boolean;
    scoringMatrix: boolean;
    timelineState: boolean;
    awardSnapshot: boolean;
  };
  cycleTimeInDays: number;
  avgSupplierScore: number | null;
  mustHaveComplianceAvg: number | null;
}

export interface CrossRfpInsights {
  longestCycleTimeRfp: string | null;
  shortestCycleTimeRfp: string | null;
  highestBudgetRfp: string | null;
  lowestBudgetRfp: string | null;
  totalSupplierParticipation: number;
  avgCycleTime: number;
  budgetRange: { min: number | null; max: number | null };
  avgBudget: number | null;
  algorithmicInsights: string[];
}

export interface SupplierParticipationMap {
  [supplierName: string]: number;
}

export interface ComparisonResult {
  rfpComparisons: RfpComparisonData[];
  crossInsights: CrossRfpInsights;
  supplierParticipationMap: SupplierParticipationMap;
  metadata: {
    totalRfps: number;
    avgCycleTime: number;
    budgetRange: { min: number | null; max: number | null };
    avgBudget: number | null;
  };
}

// ============================================================================
// Main Comparison Function
// ============================================================================

export async function compareRfps(
  rfpIds: string[],
  companyId: string,
  userId: string
): Promise<ComparisonResult> {
  // Validation: Accept exactly 2-5 RFP IDs
  if (rfpIds.length < 2 || rfpIds.length > 5) {
    throw new Error("Must provide between 2 and 5 RFP IDs for comparison");
  }

  // Fetch RFPs with necessary relations
  const rfps = await prisma.rFP.findMany({
    where: {
      id: { in: rfpIds },
      companyId,
      userId, // Verify all RFPs belong to the requesting buyer
    },
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

  // Validation: Ensure all RFPs exist and belong to the company
  if (rfps.length !== rfpIds.length) {
    throw new Error("One or more RFPs not found or access denied");
  }

  // Validation: All must be pre-award (not archived or post-award)
  const hasArchivedRfp = rfps.some((rfp) => rfp.isArchived);
  if (hasArchivedRfp) {
    throw new Error("Cannot compare archived RFPs");
  }

  // Collect comparison data for each RFP
  const rfpComparisons: RfpComparisonData[] = [];
  const supplierParticipationMap: SupplierParticipationMap = {};

  for (const rfp of rfps) {
    // Calculate cycle time
    const cycleTimeInDays = calculateCycleTime(
      rfp.createdAt,
      rfp.awardDecidedAt || new Date()
    );

    // Extract average supplier score from scoringMatrixSnapshot
    const avgSupplierScore = extractAvgSupplierScore(
      rfp.scoringMatrixSnapshot as any
    );

    // Extract must-have compliance from scoringMatrixSnapshot
    const mustHaveComplianceAvg = extractMustHaveCompliance(
      rfp.scoringMatrixSnapshot as any
    );

    // Count supplier participation
    const supplierCount = rfp.supplierContacts.length;

    // Track supplier names for participation map
    for (const contact of rfp.supplierContacts) {
      const supplierName =
        contact.name || contact.organization || contact.email;
      supplierParticipationMap[supplierName] =
        (supplierParticipationMap[supplierName] || 0) + 1;
    }

    // Build comparison data
    rfpComparisons.push({
      rfpId: rfp.id,
      title: rfp.title,
      budget: rfp.budget,
      createdAt: rfp.createdAt,
      updatedAt: rfp.createdAt, // Using createdAt as updatedAt proxy
      supplierCount,
      awardStatus: rfp.awardStatus,
      snapshotAvailability: {
        decisionBrief: !!rfp.decisionBriefSnapshot,
        scoringMatrix: !!rfp.scoringMatrixSnapshot,
        timelineState: !!rfp.timelineStateSnapshot,
        awardSnapshot: !!rfp.awardSnapshot,
      },
      cycleTimeInDays,
      avgSupplierScore,
      mustHaveComplianceAvg,
    });
  }

  // Derive cross-RFP insights
  const crossInsights = deriveCrossRfpInsights(rfpComparisons);

  // Build metadata
  const metadata = {
    totalRfps: rfpComparisons.length,
    avgCycleTime: crossInsights.avgCycleTime,
    budgetRange: crossInsights.budgetRange,
    avgBudget: crossInsights.avgBudget,
  };

  return {
    rfpComparisons,
    crossInsights,
    supplierParticipationMap,
    metadata,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateCycleTime(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)); // Convert to days
}

function extractAvgSupplierScore(scoringMatrixSnapshot: any): number | null {
  if (!scoringMatrixSnapshot || !scoringMatrixSnapshot.supplierSummaries) {
    return null;
  }

  try {
    const summaries = scoringMatrixSnapshot.supplierSummaries;
    if (!Array.isArray(summaries) || summaries.length === 0) {
      return null;
    }

    const totalScore = summaries.reduce(
      (sum: number, summary: any) => sum + (summary.overall || 0),
      0
    );
    return Math.round(totalScore / summaries.length);
  } catch {
    return null;
  }
}

function extractMustHaveCompliance(scoringMatrixSnapshot: any): number | null {
  if (!scoringMatrixSnapshot || !scoringMatrixSnapshot.supplierSummaries) {
    return null;
  }

  try {
    const summaries = scoringMatrixSnapshot.supplierSummaries;
    if (!Array.isArray(summaries) || summaries.length === 0) {
      return null;
    }

    const totalCompliance = summaries.reduce(
      (sum: number, summary: any) =>
        sum + (summary.mustHaveCompliance || 0),
      0
    );
    return Math.round(totalCompliance / summaries.length);
  } catch {
    return null;
  }
}

function deriveCrossRfpInsights(
  comparisons: RfpComparisonData[]
): CrossRfpInsights {
  // Find longest/shortest cycle time
  const sortedByCycleTime = [...comparisons].sort(
    (a, b) => b.cycleTimeInDays - a.cycleTimeInDays
  );
  const longestCycleTimeRfp = sortedByCycleTime[0]?.title || null;
  const shortestCycleTimeRfp =
    sortedByCycleTime[sortedByCycleTime.length - 1]?.title || null;

  // Find highest/lowest budget
  const rfpsWithBudget = comparisons.filter((c) => c.budget !== null);
  const sortedByBudget = [...rfpsWithBudget].sort(
    (a, b) => (b.budget || 0) - (a.budget || 0)
  );
  const highestBudgetRfp = sortedByBudget[0]?.title || null;
  const lowestBudgetRfp =
    sortedByBudget[sortedByBudget.length - 1]?.title || null;

  // Calculate total supplier participation
  const totalSupplierParticipation = comparisons.reduce(
    (sum, c) => sum + c.supplierCount,
    0
  );

  // Calculate average cycle time
  const avgCycleTime =
    comparisons.length > 0
      ? Math.round(
          comparisons.reduce((sum, c) => sum + c.cycleTimeInDays, 0) /
            comparisons.length
        )
      : 0;

  // Calculate budget range and average
  const budgets = rfpsWithBudget.map((c) => c.budget!);
  const budgetRange = {
    min: budgets.length > 0 ? Math.min(...budgets) : null,
    max: budgets.length > 0 ? Math.max(...budgets) : null,
  };
  const avgBudget =
    budgets.length > 0
      ? Math.round(budgets.reduce((sum, b) => sum + b, 0) / budgets.length)
      : null;

  // Generate algorithmic insights
  const algorithmicInsights: string[] = [];

  // Insight 1: Longest cycle time
  if (longestCycleTimeRfp) {
    const longest = sortedByCycleTime[0];
    algorithmicInsights.push(
      `${longestCycleTimeRfp} has the longest cycle time (${longest.cycleTimeInDays} days)`
    );
  }

  // Insight 2: Shortest cycle time
  if (shortestCycleTimeRfp && shortestCycleTimeRfp !== longestCycleTimeRfp) {
    const shortest = sortedByCycleTime[sortedByCycleTime.length - 1];
    algorithmicInsights.push(
      `${shortestCycleTimeRfp} completed fastest (${shortest.cycleTimeInDays} days)`
    );
  }

  // Insight 3: Supplier participation comparison
  const avgSupplierCount =
    comparisons.length > 0
      ? comparisons.reduce((sum, c) => sum + c.supplierCount, 0) /
        comparisons.length
      : 0;
  for (const comparison of comparisons) {
    if (comparison.supplierCount > avgSupplierCount * 1.5) {
      algorithmicInsights.push(
        `${comparison.title} has ${Math.round((comparison.supplierCount / avgSupplierCount) * 100)}% more suppliers than average`
      );
    }
  }

  // Insight 4: Budget range
  if (budgetRange.min !== null && budgetRange.max !== null) {
    algorithmicInsights.push(
      `Budget range: $${budgetRange.min.toLocaleString()} - $${budgetRange.max.toLocaleString()}`
    );
  }

  // Insight 5: Average cycle time
  algorithmicInsights.push(`Average cycle time: ${avgCycleTime} days`);

  // Insight 6: Cycle time efficiency
  for (const comparison of comparisons) {
    const percentDiff =
      ((comparison.cycleTimeInDays - avgCycleTime) / avgCycleTime) * 100;
    if (Math.abs(percentDiff) > 30) {
      const faster = percentDiff < 0;
      algorithmicInsights.push(
        `${comparison.title} completed ${Math.abs(Math.round(percentDiff))}% ${faster ? "faster" : "slower"} than average`
      );
    }
  }

  return {
    longestCycleTimeRfp,
    shortestCycleTimeRfp,
    highestBudgetRfp,
    lowestBudgetRfp,
    totalSupplierParticipation,
    avgCycleTime,
    budgetRange,
    avgBudget,
    algorithmicInsights: algorithmicInsights.slice(0, 6), // Limit to 4-6 insights
  };
}
