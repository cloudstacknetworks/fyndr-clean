/**
 * Portfolio Composer Service (STEP 35)
 * 
 * Aggregates and analyzes RFP portfolio data across a buyer's organization.
 * Provides high-level KPIs, stage distribution, risk analysis, readiness metrics,
 * top supplier performance, and upcoming milestones.
 */

import { prisma } from '@/lib/prisma';
import { RFPStage } from '@prisma/client';

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Summary of RFPs in a particular stage
 */
export interface PortfolioStageSummary {
  stage: string;  // RFPStage enum value
  count: number;
  totalBudget: number;
  activeRfps: number;  // Not archived
  exampleRfpTitles: string[];  // Up to 3 example titles
}

/**
 * Risk band classification (low/medium/high)
 */
export interface PortfolioRiskBand {
  band: 'low' | 'medium' | 'high';
  rfps: number;  // Count of RFPs in this risk band
  suppliers: number;  // Count of suppliers across these RFPs
  topRiskLabels: string[];  // Top 3-5 risk labels
}

/**
 * Distribution of supplier readiness indicators
 */
export interface PortfolioReadinessDistribution {
  excellentCount: number;  // >= 90
  goodCount: number;  // 75-89
  moderateCount: number;  // 60-74
  lowCount: number;  // < 60
  averageReadiness: number | null;
  sampleRfpIds: string[];  // RFPs with readiness data
}

/**
 * Supplier portfolio performance summary
 */
export interface PortfolioSupplierPortfolioSummary {
  supplierId: string;
  supplierName: string;
  organization?: string;
  totalRfpsParticipated: number;
  totalWins: number;
  avgFinalScore?: number;
  avgReadiness?: number;
  avgPricingCompetitiveness?: number;
  reliabilityIndex?: number;
  headlinePerformanceTier?: 'strategic' | 'preferred' | 'opportunistic' | 'watchlist';
}

/**
 * Timeline milestone (upcoming date)
 */
export interface PortfolioTimelineMilestone {
  date: string;  // ISO date
  milestone: string;  // e.g., "Q&A Window Closes", "Submission Deadline"
  rfpId: string;
  rfpTitle: string;
}

/**
 * Spend summary across portfolio
 */
export interface PortfolioSpendSummary {
  totalBudgetAllRfps: number;
  totalAwardedSoFar: number;
  inFlightBudget: number;  // Budget in non-awarded RFPs
  awardedCount: number;
  inFlightCount: number;
}

/**
 * Complete portfolio snapshot
 */
export interface PortfolioSnapshot {
  companyId: string;
  asOf: string;  // ISO timestamp
  generatedByUserId?: string;
  generatedUsingAI: boolean;  // Always false for now (Option 2)
  version: number;
  timeRange: {
    from?: string | null;
    to?: string | null;
  };
  kpis: {
    totalRfps: number;
    activeRfps: number;
    awardedRfps: number;
    averageReadiness: number | null;
    averageCycleTimeDays: number | null;
  };
  stages: PortfolioStageSummary[];
  riskBands: PortfolioRiskBand[];
  readinessDistribution: PortfolioReadinessDistribution;
  topSuppliers: PortfolioSupplierPortfolioSummary[];
  upcomingMilestones: PortfolioTimelineMilestone[];
  spendSummary: PortfolioSpendSummary;
}

/**
 * Portfolio metadata
 */
export interface PortfolioMeta {
  version: number;
  lastGeneratedAt: string;
  generatedUsingAI: boolean;
  isDemo: boolean;
  snapshotAgeMinutes: number;
}

// ============================================================================
// COMPOSER OPTIONS
// ============================================================================

export interface ComposePortfolioSnapshotOptions {
  useExistingSnapshotIfFresh?: boolean;  // Default: true
  maxSnapshotAgeMinutes?: number;  // Default: 60
  userId?: string;  // User triggering the generation
  timeRangeMonths?: number;  // Default: 18 (last 18 months)
}

// ============================================================================
// MAIN COMPOSER FUNCTION
// ============================================================================

/**
 * Compose a comprehensive portfolio snapshot for a company.
 * 
 * This function aggregates data from all RFPs belonging to the company,
 * computes KPIs, stage distributions, risk analysis, readiness metrics,
 * top supplier performance, and upcoming milestones.
 * 
 * @param companyId - The company ID
 * @param options - Composer options
 * @returns Portfolio snapshot and metadata
 */
export async function composePortfolioSnapshotForCompany(
  companyId: string,
  options: ComposePortfolioSnapshotOptions = {}
): Promise<{ snapshot: PortfolioSnapshot; meta: PortfolioMeta }> {
  const {
    useExistingSnapshotIfFresh = true,
    maxSnapshotAgeMinutes = 60,
    userId,
    timeRangeMonths = 18,
  } = options;

  try {
    // Step 1: Check for existing fresh snapshot
    if (useExistingSnapshotIfFresh) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { portfolioSnapshot: true, portfolioMeta: true },
      });

      if (company?.portfolioSnapshot && company?.portfolioMeta) {
        const meta = company.portfolioMeta as any;
        const lastGenerated = new Date(meta.lastGeneratedAt);
        const ageMinutes = (Date.now() - lastGenerated.getTime()) / 1000 / 60;

        if (ageMinutes <= maxSnapshotAgeMinutes) {
          // Return cached snapshot
          return {
            snapshot: company.portfolioSnapshot as unknown as PortfolioSnapshot,
            meta: {
              ...meta,
              snapshotAgeMinutes: Math.floor(ageMinutes),
            },
          };
        }
      }
    }

    // Step 2: Fetch all RFPs for the company (last 18-24 months, non-archived)
    const timeRangeStart = new Date();
    timeRangeStart.setMonth(timeRangeStart.getMonth() - timeRangeMonths);

    const rfps = await prisma.rFP.findMany({
      where: {
        companyId,
        stage: { not: 'ARCHIVED' as RFPStage },
        createdAt: { gte: timeRangeStart },
      },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
        supplier: { select: { name: true } },
        supplierContacts: {
          include: {
            supplierResponse: {
              select: {
                readinessScore: true,
                comparisonScore: true,
                riskFlags: true,
                submittedAt: true,
              },
            },
          },
        },
        stageTasks: true,
      },
    });

    // Step 3: Compute KPIs
    const totalRfps = rfps.length;
    const activeRfps = rfps.filter(r => r.stage !== RFPStage.DEBRIEF && r.stage !== RFPStage.ARCHIVED).length;
    
    // STEP 41: Count awarded RFPs using both stage and awardStatus
    const awardedRfps = rfps.filter(r => {
      // Check stage-based awards
      if (r.stage === RFPStage.DEBRIEF) return true;
      // Check STEP 41 award status
      const rfpWithAward = r as any;
      if (rfpWithAward.awardStatus === "awarded" || rfpWithAward.awardStatus === "recommended") {
        return true;
      }
      return false;
    }).length;

    // Average readiness across all supplier responses
    const allResponses = rfps.flatMap(r =>
      r.supplierContacts.filter(sc => sc.supplierResponse).map(sc => sc.supplierResponse!)
    );
    const readinessScores = allResponses
      .map(r => r.readinessScore)
      .filter((score): score is number => score !== null);
    const averageReadiness =
      readinessScores.length > 0
        ? readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length
        : null;

    // Average cycle time (days from creation to award)
    const awardedRfpsWithDates = rfps.filter(r => r.stage === RFPStage.DEBRIEF && r.createdAt);
    const cycleTimes = awardedRfpsWithDates.map(r => {
      const days = (Date.now() - r.createdAt.getTime()) / 1000 / 60 / 60 / 24;
      return Math.floor(days);
    });
    const averageCycleTimeDays =
      cycleTimes.length > 0
        ? Math.floor(cycleTimes.reduce((sum, days) => sum + days, 0) / cycleTimes.length)
        : null;

    // Step 4: Stage distribution
    const stageMap = new Map<string, { count: number; budget: number; titles: string[] }>();
    for (const rfp of rfps) {
      const stage = rfp.stage;
      if (!stageMap.has(stage)) {
        stageMap.set(stage, { count: 0, budget: 0, titles: [] });
      }
      const stageData = stageMap.get(stage)!;
      stageData.count++;
      stageData.budget += rfp.budget || 0;
      if (stageData.titles.length < 3) {
        stageData.titles.push(rfp.title);
      }
    }

    const stages: PortfolioStageSummary[] = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      totalBudget: data.budget,
      activeRfps: data.count,
      exampleRfpTitles: data.titles,
    }));

    // Step 5: Risk bands (classify RFPs as low/medium/high based on risk flags)
    const riskBands: PortfolioRiskBand[] = [
      { band: 'low', rfps: 0, suppliers: 0, topRiskLabels: [] },
      { band: 'medium', rfps: 0, suppliers: 0, topRiskLabels: [] },
      { band: 'high', rfps: 0, suppliers: 0, topRiskLabels: [] },
    ];

    for (const rfp of rfps) {
      const responses = rfp.supplierContacts
        .filter(sc => sc.supplierResponse)
        .map(sc => sc.supplierResponse!);
      const riskFlags = responses.flatMap(r => (r.riskFlags as any)?.flags || []);
      const highRisks = riskFlags.filter((flag: any) => flag.severity === 'HIGH').length;
      const mediumRisks = riskFlags.filter((flag: any) => flag.severity === 'MEDIUM').length;

      if (highRisks > 0) {
        riskBands[2].rfps++;
        riskBands[2].suppliers += responses.length;
      } else if (mediumRisks > 1) {
        riskBands[1].rfps++;
        riskBands[1].suppliers += responses.length;
      } else {
        riskBands[0].rfps++;
        riskBands[0].suppliers += responses.length;
      }
    }

    // Step 6: Readiness distribution
    const excellentCount = readinessScores.filter(s => s >= 90).length;
    const goodCount = readinessScores.filter(s => s >= 75 && s < 90).length;
    const moderateCount = readinessScores.filter(s => s >= 60 && s < 75).length;
    const lowCount = readinessScores.filter(s => s < 60).length;

    const readinessDistribution: PortfolioReadinessDistribution = {
      excellentCount,
      goodCount,
      moderateCount,
      lowCount,
      averageReadiness,
      sampleRfpIds: rfps.filter(r => r.supplierContacts.some(sc => sc.supplierResponse?.readinessScore)).map(r => r.id).slice(0, 10),
    };

    // Step 7: Top suppliers (simplified for now)
    const supplierMap = new Map<string, {
      name: string;
      org?: string;
      participated: number;
      wins: number;
      scores: number[];
      readiness: number[];
    }>();

    for (const rfp of rfps) {
      for (const contact of rfp.supplierContacts) {
        const supplierId = contact.id;
        const supplierName = contact.name;
        const org = contact.organization || undefined;

        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            name: supplierName,
            org,
            participated: 0,
            wins: 0,
            scores: [],
            readiness: [],
          });
        }

        const data = supplierMap.get(supplierId)!;
        data.participated++;

        if (contact.supplierResponse) {
          const response = contact.supplierResponse;
          if (response.comparisonScore) {
            data.scores.push(response.comparisonScore);
          }
          if (response.readinessScore) {
            data.readiness.push(response.readinessScore);
          }
          // Simplified win detection: highest comparison score (would need actual award data)
          if (response.comparisonScore && response.comparisonScore > 80) {
            data.wins++;
          }
        }
      }
    }

    const topSuppliers: PortfolioSupplierPortfolioSummary[] = Array.from(supplierMap.entries())
      .map(([id, data]) => {
        const winRate = data.participated > 0 ? data.wins / data.participated : 0;
        let tier: "strategic" | "preferred" | "opportunistic" | "watchlist" | undefined;
        if (data.participated === 0) {
          tier = undefined;
        } else if (winRate >= 0.7) {
          tier = "strategic";
        } else if (winRate >= 0.5) {
          tier = "preferred";
        } else if (winRate >= 0.3) {
          tier = "opportunistic";
        } else {
          tier = "watchlist";
        }
        
        return {
          supplierId: id,
          supplierName: data.name,
          organization: data.org,
          totalRfpsParticipated: data.participated,
          totalWins: data.wins,
          avgFinalScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : undefined,
          avgReadiness: data.readiness.length > 0 ? data.readiness.reduce((a, b) => a + b, 0) / data.readiness.length : undefined,
          reliabilityIndex: data.participated > 0 ? (data.wins / data.participated) * 100 : undefined,
          headlinePerformanceTier: tier,
        };
      })
      .sort((a, b) => (b.reliabilityIndex || 0) - (a.reliabilityIndex || 0))
      .slice(0, 10);

    // Step 8: Upcoming milestones (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingMilestones: PortfolioTimelineMilestone[] = [];

    for (const rfp of rfps) {
      if (rfp.askQuestionsEnd && rfp.askQuestionsEnd > now && rfp.askQuestionsEnd < thirtyDaysFromNow) {
        upcomingMilestones.push({
          date: rfp.askQuestionsEnd.toISOString(),
          milestone: 'Q&A Window Closes',
          rfpId: rfp.id,
          rfpTitle: rfp.title,
        });
      }
      if (rfp.submissionEnd && rfp.submissionEnd > now && rfp.submissionEnd < thirtyDaysFromNow) {
        upcomingMilestones.push({
          date: rfp.submissionEnd.toISOString(),
          milestone: 'Submission Deadline',
          rfpId: rfp.id,
          rfpTitle: rfp.title,
        });
      }
      if (rfp.awardDate && rfp.awardDate > now && rfp.awardDate < thirtyDaysFromNow) {
        upcomingMilestones.push({
          date: rfp.awardDate.toISOString(),
          milestone: 'Award Date',
          rfpId: rfp.id,
          rfpTitle: rfp.title,
        });
      }
    }
    upcomingMilestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Step 9: Spend summary
    const totalBudgetAllRfps = rfps.reduce((sum, r) => sum + (r.budget || 0), 0);
    const awardedBudget = rfps.filter(r => r.stage === RFPStage.DEBRIEF).reduce((sum, r) => sum + (r.budget || 0), 0);
    const inFlightBudget = totalBudgetAllRfps - awardedBudget;

    const spendSummary: PortfolioSpendSummary = {
      totalBudgetAllRfps,
      totalAwardedSoFar: awardedBudget,
      inFlightBudget,
      awardedCount: awardedRfps,
      inFlightCount: activeRfps,
    };

    // Step 10: Create snapshot
    const snapshot: PortfolioSnapshot = {
      companyId,
      asOf: new Date().toISOString(),
      generatedByUserId: userId,
      generatedUsingAI: false,
      version: 1,
      timeRange: {
        from: timeRangeStart.toISOString(),
        to: new Date().toISOString(),
      },
      kpis: {
        totalRfps,
        activeRfps,
        awardedRfps,
        averageReadiness,
        averageCycleTimeDays,
      },
      stages,
      riskBands,
      readinessDistribution,
      topSuppliers,
      upcomingMilestones: upcomingMilestones.slice(0, 15),
      spendSummary,
    };

    // Step 11: Persist to database
    const meta: PortfolioMeta = {
      version: 1,
      lastGeneratedAt: new Date().toISOString(),
      generatedUsingAI: false,
      isDemo: false,
      snapshotAgeMinutes: 0,
    };

    await prisma.company.update({
      where: { id: companyId },
      data: {
        portfolioSnapshot: snapshot as any,
        portfolioMeta: meta as any,
      },
    });

    return { snapshot, meta };
  } catch (error) {
    console.error('[composePortfolioSnapshotForCompany] Error:', error);
    
    // Return safe default snapshot
    const emptySnapshot: PortfolioSnapshot = {
      companyId,
      asOf: new Date().toISOString(),
      generatedUsingAI: false,
      version: 1,
      timeRange: { from: null, to: null },
      kpis: {
        totalRfps: 0,
        activeRfps: 0,
        awardedRfps: 0,
        averageReadiness: null,
        averageCycleTimeDays: null,
      },
      stages: [],
      riskBands: [
        { band: 'low', rfps: 0, suppliers: 0, topRiskLabels: [] },
        { band: 'medium', rfps: 0, suppliers: 0, topRiskLabels: [] },
        { band: 'high', rfps: 0, suppliers: 0, topRiskLabels: [] },
      ],
      readinessDistribution: {
        excellentCount: 0,
        goodCount: 0,
        moderateCount: 0,
        lowCount: 0,
        averageReadiness: null,
        sampleRfpIds: [],
      },
      topSuppliers: [],
      upcomingMilestones: [],
      spendSummary: {
        totalBudgetAllRfps: 0,
        totalAwardedSoFar: 0,
        inFlightBudget: 0,
        awardedCount: 0,
        inFlightCount: 0,
      },
    };

    const emptyMeta: PortfolioMeta = {
      version: 1,
      lastGeneratedAt: new Date().toISOString(),
      generatedUsingAI: false,
      isDemo: false,
      snapshotAgeMinutes: 0,
    };

    return { snapshot: emptySnapshot, meta: emptyMeta };
  }
}
