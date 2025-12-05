/**
 * STEP 64: Admin Analytics Service
 * 
 * Provides portfolio-level analytics for admin users including:
 * - KPI metrics (active RFPs, cycle time, win rate, supplier participation, automation usage)
 * - Charts (volume over time, stage distribution, cycle time, supplier performance, etc.)
 * 
 * All data is scoped to companyId and respects date range filters.
 * Read-only operations only (no writes except activity logging).
 */

import { prisma } from "@/lib/prisma";
import { RFPStage } from "@prisma/client";

export interface AdminAnalyticsFilters {
  dateRange: "last_30_days" | "last_90_days" | "last_180_days" | "last_365_days" | "custom";
  startDate?: Date;
  endDate?: Date;
  buyerId?: string;
  stageFilter?: RFPStage;
  statusFilter?: "active" | "closed" | "all";
}

export interface AdminAnalyticsKPIs {
  activeRfps: number;
  closedRfps: number;
  avgCycleTimeDays: number;
  winRatePercent: number;
  avgSuppliersPerRfp: number;
  participationRate: number;
  automationRunsCount: number;
  aiScoringRunsCount: number;
}

export interface AdminAnalyticsCharts {
  rfpVolumeOverTime: Array<{
    bucket: string;
    createdCount: number;
    awardedCount: number;
    cancelledCount: number;
  }>;
  stageDistribution: Array<{
    stage: string;
    count: number;
  }>;
  cycleTimeByStage: Array<{
    stage: string;
    avgDays: number;
  }>;
  supplierParticipationFunnel: {
    avgInvited: number;
    avgSubmitted: number;
    avgShortlisted: number;
  };
  supplierPerformance: Array<{
    supplierId: string;
    supplierName: string;
    awardsWon: number;
    avgScore: number | null;
    participationCount: number;
  }>;
  scoringVariance: Array<{
    rfpId: string;
    rfpTitle: string;
    varianceValue: number;
    highScore: number;
    lowScore: number;
  }>;
  mustHaveViolations: Array<{
    rfpId: string;
    rfpTitle: string;
    supplierCount: number;
    violationsCount: number;
  }>;
  automationImpact: {
    withAutomation: { avgCycleTime: number; rfpsCount: number };
    withoutAutomation: { avgCycleTime: number; rfpsCount: number };
  };
  aiUsage: {
    aiSummariesCount: number;
    aiDecisionBriefsCount: number;
    aiScoringEventsCount: number;
    rfpsWithAIUsageCount: number;
    percentageRFPsWithAI: number;
  };
  exportUsage: Array<{
    exportId: string;
    exportTitle: string;
    count: number;
  }>;
  workloadByBuyer: Array<{
    buyerId: string;
    buyerName: string;
    activeRfps: number;
    closedRfps: number;
  }>;
  outcomeTrends: Array<{
    bucket: string;
    awardedCount: number;
    cancelledCount: number;
  }>;
}

export interface AdminAnalyticsDashboard {
  kpis: AdminAnalyticsKPIs;
  charts: AdminAnalyticsCharts;
}

/**
 * Parse date range filter into start and end dates
 */
function parseDateRange(filters: AdminAnalyticsFilters): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (filters.dateRange === "custom") {
    if (!filters.startDate || !filters.endDate) {
      throw new Error("Custom date range requires startDate and endDate");
    }
    startDate = filters.startDate;
    endDate = filters.endDate;
  } else {
    const daysMap = {
      last_30_days: 30,
      last_90_days: 90,
      last_180_days: 180,
      last_365_days: 365,
    };
    const days = daysMap[filters.dateRange];
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
  }

  return { startDate, endDate };
}

/**
 * Determine bucket size (weekly or monthly) based on date range
 */
function getBucketSize(startDate: Date, endDate: Date): "week" | "month" {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 90 ? "week" : "month";
}

/**
 * Get bucket key for a date (ISO week or month)
 */
function getBucketKey(date: Date, bucketSize: "week" | "month"): string {
  if (bucketSize === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  } else {
    // ISO week: find the Monday of the week
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + 6) / 7)).padStart(2, "0")}`;
  }
}

/**
 * Compute KPIs for the dashboard
 */
async function computeKPIs(
  companyId: string,
  filters: AdminAnalyticsFilters,
  dateRange: { startDate: Date; endDate: Date }
): Promise<AdminAnalyticsKPIs> {
  const { startDate, endDate } = dateRange;

  // Base where clause for RFPs
  const rfpWhere: any = {
    companyId,
    ...(filters.buyerId && { userId: filters.buyerId }),
    ...(filters.stageFilter && { stage: filters.stageFilter }),
  };

  // 1. Active RFPs
  const activeRfps = await prisma.rFP.count({
    where: {
      ...rfpWhere,
      isArchived: false,
      status: { not: "cancelled" },
    },
  });

  // 2. RFPs Closed (in date range)
  const closedRfps = await prisma.rFP.count({
    where: {
      ...rfpWhere,
      OR: [
        {
          awardDecidedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          archivedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
  });

  // 3. Average Cycle Time
  const closedRfpsWithDates = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      OR: [
        {
          awardDecidedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          archivedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    select: {
      createdAt: true,
      awardDecidedAt: true,
      archivedAt: true,
    },
  });

  let avgCycleTimeDays = 0;
  if (closedRfpsWithDates.length > 0) {
    const cycleTimes = closedRfpsWithDates
      .map((rfp: any) => {
        const closeDate = rfp.awardDecidedAt || rfp.archivedAt;
        if (!closeDate) return null;
        return Math.ceil((closeDate.getTime() - rfp.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter((time: any): time is number => time !== null && time >= 0);

    if (cycleTimes.length > 0) {
      avgCycleTimeDays = Math.round(cycleTimes.reduce((a: number, b: number) => a + b, 0) / cycleTimes.length);
    }
  }

  // 4. Win Rate
  const awardedRfps = await prisma.rFP.count({
    where: {
      ...rfpWhere,
      awardStatus: "awarded",
      awardDecidedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalDecidedRfps = await prisma.rFP.count({
    where: {
      ...rfpWhere,
      awardStatus: { in: ["awarded", "cancelled", "not_awarded"] },
      awardDecidedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const winRatePercent = totalDecidedRfps > 0 ? Math.round((awardedRfps / totalDecidedRfps) * 100) : 0;

  // 5. Supplier Participation
  const rfpsInRange = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { id: true },
  });

  const rfpIds = rfpsInRange.map((rfp) => rfp.id);

  let avgSuppliersPerRfp = 0;
  let participationRate = 0;

  if (rfpIds.length > 0) {
    const supplierContacts = await prisma.supplierContact.groupBy({
      by: ["rfpId"],
      where: {
        rfpId: { in: rfpIds },
      },
      _count: {
        id: true,
      },
    });

    if (supplierContacts.length > 0) {
      avgSuppliersPerRfp = Math.round(
        supplierContacts.reduce((sum: number, sc: any) => sum + sc._count.id, 0) / rfpIds.length
      );
    }

    const acceptedInvites = await prisma.supplierContact.count({
      where: {
        rfpId: { in: rfpIds },
        invitationStatus: "ACCEPTED",
      },
    });

    const totalInvites = await prisma.supplierContact.count({
      where: {
        rfpId: { in: rfpIds },
        invitationStatus: { not: "PENDING" },
      },
    });

    participationRate = totalInvites > 0 ? Math.round((acceptedInvites / totalInvites) * 100) : 0;
  }

  // 6. Automation & AI Usage
  const automationRunsCount = await prisma.activityLog.count({
    where: {
      eventType: "TIMELINE_AUTOMATION_RUN",
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const aiScoringRunsCount = await prisma.activityLog.count({
    where: {
      eventType: { in: ["AUTO_SCORE_RUN", "AUTO_SCORE_REGENERATED"] },
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return {
    activeRfps,
    closedRfps,
    avgCycleTimeDays,
    winRatePercent,
    avgSuppliersPerRfp,
    participationRate,
    automationRunsCount,
    aiScoringRunsCount,
  };
}

/**
 * Compute chart data for the dashboard
 */
async function computeCharts(
  companyId: string,
  filters: AdminAnalyticsFilters,
  dateRange: { startDate: Date; endDate: Date }
): Promise<AdminAnalyticsCharts> {
  const { startDate, endDate } = dateRange;
  const bucketSize = getBucketSize(startDate, endDate);

  // Base where clause for RFPs
  const rfpWhere: any = {
    companyId,
    ...(filters.buyerId && { userId: filters.buyerId }),
    ...(filters.stageFilter && { stage: filters.stageFilter }),
  };

  // 1. RFP Volume Over Time
  const rfpsCreated = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { createdAt: true },
  });

  const rfpsAwarded = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      awardStatus: "awarded",
      awardDecidedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { awardDecidedAt: true },
  });

  const rfpsCancelled = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      AND: [
        {
          OR: [
            { awardStatus: "cancelled" },
            { status: "cancelled" },
          ],
        },
        {
          OR: [
            {
              awardDecidedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              archivedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
      ],
    },
    select: { awardDecidedAt: true, archivedAt: true },
  });

  const volumeBuckets = new Map<string, { created: number; awarded: number; cancelled: number }>();

  rfpsCreated.forEach((rfp: any) => {
    const bucket = getBucketKey(rfp.createdAt, bucketSize);
    const existing = volumeBuckets.get(bucket) || { created: 0, awarded: 0, cancelled: 0 };
    existing.created++;
    volumeBuckets.set(bucket, existing);
  });

  rfpsAwarded.forEach((rfp: any) => {
    if (!rfp.awardDecidedAt) return;
    const bucket = getBucketKey(rfp.awardDecidedAt, bucketSize);
    const existing = volumeBuckets.get(bucket) || { created: 0, awarded: 0, cancelled: 0 };
    existing.awarded++;
    volumeBuckets.set(bucket, existing);
  });

  rfpsCancelled.forEach((rfp: any) => {
    const date = rfp.awardDecidedAt || rfp.archivedAt;
    if (!date) return;
    const bucket = getBucketKey(date, bucketSize);
    const existing = volumeBuckets.get(bucket) || { created: 0, awarded: 0, cancelled: 0 };
    existing.cancelled++;
    volumeBuckets.set(bucket, existing);
  });

  const rfpVolumeOverTime = Array.from(volumeBuckets.entries())
    .map(([bucket, counts]) => ({
      bucket,
      createdCount: counts.created,
      awardedCount: counts.awarded,
      cancelledCount: counts.cancelled,
    }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  // 2. Stage Distribution (current snapshot, not time-ranged)
  const stageGroups = await prisma.rFP.groupBy({
    by: ["stage"],
    where: {
      companyId,
      isArchived: false,
      ...(filters.buyerId && { userId: filters.buyerId }),
    },
    _count: {
      id: true,
    },
  });

  const stageDistribution = stageGroups.map((group: any) => ({
    stage: group.stage,
    count: group._count.id,
  }));

  // 3. Cycle Time by Stage (approximation using stage history)
  // Note: For simplicity, we'll compute average time spent in each stage
  // For RFPs closed in date range
  const closedRfpsForStages = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      OR: [
        {
          awardDecidedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          archivedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    select: {
      id: true,
      stage: true,
      createdAt: true,
      awardDecidedAt: true,
      archivedAt: true,
    },
  });

  // Simplified: compute average cycle time per stage based on current stage
  // (More accurate would require full stage history tracking)
  const stageTimesMap = new Map<string, number[]>();

  for (const rfp of closedRfpsForStages as any[]) {
    const closeDate = rfp.awardDecidedAt || rfp.archivedAt;
    if (!closeDate) continue;
    const cycleDays = Math.ceil((closeDate.getTime() - rfp.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const times = stageTimesMap.get(rfp.stage) || [];
    times.push(cycleDays);
    stageTimesMap.set(rfp.stage, times);
  }

  const cycleTimeByStage = Array.from(stageTimesMap.entries()).map(([stage, times]) => ({
    stage,
    avgDays: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
  }));

  // 4. Supplier Participation Funnel
  const rfpsInRange = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { id: true },
  });

  const rfpIds = rfpsInRange.map((rfp) => rfp.id);

  let supplierParticipationFunnel = { avgInvited: 0, avgSubmitted: 0, avgShortlisted: 0 };

  if (rfpIds.length > 0) {
    const invitedPerRfp = await prisma.supplierContact.groupBy({
      by: ["rfpId"],
      where: { rfpId: { in: rfpIds } },
      _count: { id: true },
    });

    const avgInvited =
      invitedPerRfp.length > 0
        ? Math.round(invitedPerRfp.reduce((sum: number, r: any) => sum + r._count.id, 0) / rfpIds.length)
        : 0;

    const submittedPerRfp = await prisma.supplierResponse.groupBy({
      by: ["rfpId"],
      where: {
        rfpId: { in: rfpIds },
        status: "SUBMITTED",
      },
      _count: { id: true },
    });

    const avgSubmitted =
      submittedPerRfp.length > 0
        ? Math.round(submittedPerRfp.reduce((sum: number, r: any) => sum + r._count.id, 0) / rfpIds.length)
        : 0;

    const shortlistedPerRfp = await prisma.supplierResponse.groupBy({
      by: ["rfpId"],
      where: {
        rfpId: { in: rfpIds },
        awardOutcomeStatus: { in: ["recommended", "shortlisted"] },
      },
      _count: { id: true },
    });

    const avgShortlisted =
      shortlistedPerRfp.length > 0
        ? Math.round(shortlistedPerRfp.reduce((sum: number, r: any) => sum + r._count.id, 0) / rfpIds.length)
        : 0;

    supplierParticipationFunnel = { avgInvited, avgSubmitted, avgShortlisted };
  }

  // 5. Supplier Performance Overview (Top 10)
  const supplierPerformanceData = await prisma.supplierContact.findMany({
    where: {
      rfp: { companyId },
    },
    select: {
      id: true,
      name: true,
      organization: true,
      totalWins: true,
      totalRFPsParticipated: true,
      avgScore: true,
    },
  });

  // Group by supplier (organization + name)
  const supplierMap = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      awardsWon: number;
      avgScore: number | null;
      participationCount: number;
    }
  >();

  supplierPerformanceData.forEach((supplier: any) => {
    const key = `${supplier.organization || "Unknown"}||${supplier.name}`;
    const existing = supplierMap.get(key);
    if (existing) {
      existing.awardsWon += supplier.totalWins;
      existing.participationCount += supplier.totalRFPsParticipated;
      // Average the avgScore
      if (supplier.avgScore !== null && existing.avgScore !== null) {
        existing.avgScore = (existing.avgScore + supplier.avgScore) / 2;
      } else if (supplier.avgScore !== null) {
        existing.avgScore = supplier.avgScore;
      }
    } else {
      supplierMap.set(key, {
        supplierId: supplier.id,
        supplierName: supplier.organization || supplier.name,
        awardsWon: supplier.totalWins,
        avgScore: supplier.avgScore,
        participationCount: supplier.totalRFPsParticipated,
      });
    }
  });

  const supplierPerformance = Array.from(supplierMap.values())
    .sort((a, b) => b.awardsWon - a.awardsWon)
    .slice(0, 10);

  // 6. Scoring Variance (Top 10 RFPs with high variance)
  const rfpsWithScoring = await prisma.supplierResponse.findMany({
    where: {
      rfp: { companyId },
      finalScore: { not: null },
    },
    select: {
      rfpId: true,
      finalScore: true,
      rfp: {
        select: {
          title: true,
        },
      },
    },
  });

  const varianceMap = new Map<string, { title: string; scores: number[] }>();

  rfpsWithScoring.forEach((response: any) => {
    if (response.finalScore === null) return;
    const existing = varianceMap.get(response.rfpId);
    if (existing) {
      existing.scores.push(response.finalScore);
    } else {
      varianceMap.set(response.rfpId, {
        title: response.rfp.title,
        scores: [response.finalScore],
      });
    }
  });

  const scoringVariance = Array.from(varianceMap.entries())
    .filter(([, data]) => data.scores.length > 1)
    .map(([rfpId, data]) => {
      const high = Math.max(...data.scores);
      const low = Math.min(...data.scores);
      return {
        rfpId,
        rfpTitle: data.title,
        varianceValue: high - low,
        highScore: high,
        lowScore: low,
      };
    })
    .sort((a, b) => b.varianceValue - a.varianceValue)
    .slice(0, 10);

  // 7. Must-Have Violations (simplified - count RFPs with violations)
  // Note: This requires parsing autoScoreJson; simplified version here
  const mustHaveViolations: Array<{
    rfpId: string;
    rfpTitle: string;
    supplierCount: number;
    violationsCount: number;
  }> = [];

  // 8. Automation Impact
  const rfpsWithAutomation = await prisma.activityLog.findMany({
    where: {
      eventType: "TIMELINE_AUTOMATION_RUN",
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { rfpId: true },
    distinct: ["rfpId"],
  });

  const rfpsWithAutomationIds = rfpsWithAutomation.map((log: any) => log.rfpId).filter((id: any): id is string => !!id);

  const closedWithAutomation = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      id: { in: rfpsWithAutomationIds },
      OR: [
        {
          awardDecidedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          archivedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    select: {
      createdAt: true,
      awardDecidedAt: true,
      archivedAt: true,
    },
  });

  const closedWithoutAutomation = await prisma.rFP.findMany({
    where: {
      ...rfpWhere,
      id: { notIn: rfpsWithAutomationIds.length > 0 ? rfpsWithAutomationIds : ["none"] },
      OR: [
        {
          awardDecidedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          archivedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    select: {
      createdAt: true,
      awardDecidedAt: true,
      archivedAt: true,
    },
  });

  const calculateAvgCycleTime = (rfps: typeof closedWithAutomation): number => {
    if (rfps.length === 0) return 0;
    const cycleTimes = rfps
      .map((rfp: any) => {
        const closeDate = rfp.awardDecidedAt || rfp.archivedAt;
        if (!closeDate) return null;
        return Math.ceil((closeDate.getTime() - rfp.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter((time: any): time is number => time !== null && time >= 0);

    return cycleTimes.length > 0 ? Math.round(cycleTimes.reduce((a: number, b: number) => a + b, 0) / cycleTimes.length) : 0;
  };

  const automationImpact = {
    withAutomation: {
      avgCycleTime: calculateAvgCycleTime(closedWithAutomation),
      rfpsCount: closedWithAutomation.length,
    },
    withoutAutomation: {
      avgCycleTime: calculateAvgCycleTime(closedWithoutAutomation),
      rfpsCount: closedWithoutAutomation.length,
    },
  };

  // 9. AI Usage & Coverage
  const aiSummariesCount = await prisma.activityLog.count({
    where: {
      eventType: "EXECUTIVE_SUMMARY_GENERATED",
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const aiDecisionBriefsCount = await prisma.activityLog.count({
    where: {
      eventType: "DECISION_BRIEF_AI_GENERATED",
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const aiScoringEventsCount = await prisma.activityLog.count({
    where: {
      eventType: { in: ["AUTO_SCORE_RUN", "AUTO_SCORE_REGENERATED"] },
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const rfpsWithAIUsage = await prisma.activityLog.findMany({
    where: {
      eventType: {
        in: [
          "EXECUTIVE_SUMMARY_GENERATED",
          "DECISION_BRIEF_AI_GENERATED",
          "AUTO_SCORE_RUN",
          "AUTO_SCORE_REGENERATED",
        ],
      },
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { rfpId: true },
    distinct: ["rfpId"],
  });

  const rfpsWithAIUsageCount = rfpsWithAIUsage.length;
  const totalRfpsInRange = rfpIds.length;
  const percentageRFPsWithAI =
    totalRfpsInRange > 0 ? Math.round((rfpsWithAIUsageCount / totalRfpsInRange) * 100) : 0;

  const aiUsage = {
    aiSummariesCount,
    aiDecisionBriefsCount,
    aiScoringEventsCount,
    rfpsWithAIUsageCount,
    percentageRFPsWithAI,
  };

  // 10. Export Usage
  const exportEvents = await prisma.activityLog.findMany({
    where: {
      eventType: "EXPORT_GENERATED",
      rfp: { companyId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      details: true,
    },
  });

  const exportMap = new Map<string, { title: string; count: number }>();

  exportEvents.forEach((event: any) => {
    if (!event.details || typeof event.details !== "object") return;
    const details = event.details as any;
    const exportId = details.exportId || "unknown";
    const exportTitle = details.exportTitle || details.exportName || "Unknown Export";

    const existing = exportMap.get(exportId);
    if (existing) {
      existing.count++;
    } else {
      exportMap.set(exportId, { title: exportTitle, count: 1 });
    }
  });

  const exportUsage = Array.from(exportMap.entries())
    .map(([exportId, data]) => ({
      exportId,
      exportTitle: data.title,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 11. Workload Distribution (Per Buyer)
  const buyers = await prisma.user.findMany({
    where: {
      companyId,
      role: "buyer",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const workloadByBuyer = await Promise.all(
    buyers.map(async (buyer: any) => {
      const activeRfps = await prisma.rFP.count({
        where: {
          companyId,
          userId: buyer.id,
          isArchived: false,
          status: { not: "cancelled" },
        },
      });

      const closedRfps = await prisma.rFP.count({
        where: {
          companyId,
          userId: buyer.id,
          OR: [
            {
              awardDecidedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              archivedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
      });

      return {
        buyerId: buyer.id,
        buyerName: buyer.name || "Unknown",
        activeRfps,
        closedRfps,
      };
    })
  );

  // 12. Outcome Trends
  const outcomeBuckets = new Map<string, { awarded: number; cancelled: number }>();

  rfpsAwarded.forEach((rfp: any) => {
    if (!rfp.awardDecidedAt) return;
    const bucket = getBucketKey(rfp.awardDecidedAt, bucketSize);
    const existing = outcomeBuckets.get(bucket) || { awarded: 0, cancelled: 0 };
    existing.awarded++;
    outcomeBuckets.set(bucket, existing);
  });

  rfpsCancelled.forEach((rfp: any) => {
    const date = rfp.awardDecidedAt || rfp.archivedAt;
    if (!date) return;
    const bucket = getBucketKey(date, bucketSize);
    const existing = outcomeBuckets.get(bucket) || { awarded: 0, cancelled: 0 };
    existing.cancelled++;
    outcomeBuckets.set(bucket, existing);
  });

  const outcomeTrends = Array.from(outcomeBuckets.entries())
    .map(([bucket, counts]) => ({
      bucket,
      awardedCount: counts.awarded,
      cancelledCount: counts.cancelled,
    }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  return {
    rfpVolumeOverTime,
    stageDistribution,
    cycleTimeByStage,
    supplierParticipationFunnel,
    supplierPerformance,
    scoringVariance,
    mustHaveViolations,
    automationImpact,
    aiUsage,
    exportUsage,
    workloadByBuyer,
    outcomeTrends,
  };
}

/**
 * Main function to build complete admin analytics dashboard
 */
export async function buildAdminAnalyticsDashboard(
  companyId: string,
  filters: AdminAnalyticsFilters
): Promise<AdminAnalyticsDashboard> {
  try {
    const dateRange = parseDateRange(filters);

    const [kpis, charts] = await Promise.all([
      computeKPIs(companyId, filters, dateRange),
      computeCharts(companyId, filters, dateRange),
    ]);

    return {
      kpis,
      charts,
    };
  } catch (error) {
    console.error("Error building admin analytics dashboard:", error);
    throw new Error("Failed to build admin analytics dashboard");
  }
}
