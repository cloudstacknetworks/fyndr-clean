/**
 * STEP 34: Executive Decision Brief Composer Service
 * 
 * This service aggregates data from multiple sources to produce comprehensive
 * executive decision briefs for RFPs. It provides a snapshot of supplier
 * performance, risk assessment, and recommendations without making decisions.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TypeScript Types
// ============================================================================

export type DecisionBriefAudience = "executive" | "procurement" | "it" | "finance";

export interface DecisionBriefSupplierSummary {
  supplierId: string;
  supplierName: string;
  organization: string | null;
  finalScore: number | null;
  readinessScore: number | null;
  readinessTier: string | null;
  pricingScore: number | null;
  pricingPosition: string | null;
  submissionSpeedDays: number | null;
  reliabilityIndex: number | null;
  headlineRiskLevel: "low" | "medium" | "high";
}

export interface DecisionBriefCoreRecommendation {
  recommendedSupplierId: string | null;
  recommendedSupplierName: string | null;
  recommendationType: "recommend_award" | "recommend_negotiation" | "recommend_rebid" | "no_recommendation";
  confidenceScore: number;
  primaryRationaleBullets: string[];
}

export interface DecisionBriefRiskSummary {
  overallRiskLevel: "low" | "medium" | "high";
  keyRisks: string[];
  mitigationActions: string[];
}

export interface DecisionBriefTimelineSummary {
  currentStage: string;
  upcomingMilestones: Array<{
    label: string;
    date: string | null;
    daysRemaining: number | null;
  }>;
  suggestedNextSteps: string[];
}

export interface DecisionBriefNarrative {
  executiveSummary: string;
  procurementNotes: string;
  itNotes: string;
  financeNotes: string;
}

export interface DecisionBriefSnapshot {
  rfpId: string;
  rfpTitle: string;
  rfpOwnerName: string | null;
  rfpBudget: number | null;
  rfpStatus: string;
  rfpStage: string;
  coreRecommendation: DecisionBriefCoreRecommendation;
  supplierSummaries: DecisionBriefSupplierSummary[];
  riskSummary: DecisionBriefRiskSummary;
  timelineSummary: DecisionBriefTimelineSummary;
  narrative: DecisionBriefNarrative;
  generatedAt: string;
  generatedByUserId: string | null;
  generatedUsingAI: boolean;
  version: number;
  audiences: DecisionBriefAudience[];
}

export interface ComposeDecisionBriefOptions {
  useExistingSnapshotIfFresh?: boolean;
  freshnessThresholdMinutes?: number;
}

// ============================================================================
// Core Composer Function
// ============================================================================

/**
 * Composes a comprehensive decision brief for the given RFP.
 * 
 * @param rfpId - The RFP identifier
 * @param options - Configuration options
 * @returns A complete decision brief snapshot
 */
export async function composeDecisionBriefForRfp(
  rfpId: string,
  options: ComposeDecisionBriefOptions = {}
): Promise<DecisionBriefSnapshot> {
  const {
    useExistingSnapshotIfFresh = false,
    freshnessThresholdMinutes = 60,
  } = options;

  try {
    // Step 1: Load RFP metadata
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        user: { select: { name: true } },
        company: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });

    if (!rfp) {
      throw new Error(`RFP with ID ${rfpId} not found`);
    }

    // Step 2: Check if we can reuse existing snapshot
    if (useExistingSnapshotIfFresh && rfp.decisionBriefSnapshot && rfp.decisionBriefMeta) {
      const meta = rfp.decisionBriefMeta as any;
      const generatedAt = new Date(meta.lastGeneratedAt || 0);
      const now = new Date();
      const minutesSinceGeneration = (now.getTime() - generatedAt.getTime()) / (1000 * 60);

      if (minutesSinceGeneration < freshnessThresholdMinutes) {
        return rfp.decisionBriefSnapshot as DecisionBriefSnapshot;
      }
    }

    // Step 3: Load supplier responses with all necessary data
    const supplierResponses = await prisma.supplierResponse.findMany({
      where: {
        supplierContact: {
          rfpId: rfpId,
        },
        responseStatus: 'SUBMITTED',
      },
      include: {
        supplierContact: {
          select: {
            name: true,
            organization: true,
            invitedAt: true,
          },
        },
      },
    });

    // Step 4: Build supplier summaries
    const supplierSummaries: DecisionBriefSupplierSummary[] = supplierResponses.map((response) => {
      const finalScore = response.comparisonScore || null;
      const readinessScore = response.readinessScore || null;
      const readinessTier = getReadinessTier(readinessScore);
      const pricingData = response.extractedPricing as any;
      const pricingScore = response.comparisonBreakdown ? (response.comparisonBreakdown as any).pricingCompetitiveness : null;
      const pricingPosition = getPricingPosition(pricingScore);
      
      // Calculate submission speed
      const invitedAt = response.supplierContact.invitedAt;
      const submittedAt = response.submittedAt;
      let submissionSpeedDays = null;
      if (invitedAt && submittedAt) {
        const diff = submittedAt.getTime() - invitedAt.getTime();
        submissionSpeedDays = Math.round(diff / (1000 * 60 * 60 * 24));
      }

      // Calculate reliability index (simple average of key metrics)
      const reliabilityIndex = calculateReliabilityIndex(finalScore, readinessScore, pricingScore);

      // Determine headline risk level
      const riskFlags = response.riskFlags as any[];
      const headlineRiskLevel = getHeadlineRiskLevel(riskFlags);

      return {
        supplierId: response.id,
        supplierName: response.supplierContact.name,
        organization: response.supplierContact.organization,
        finalScore,
        readinessScore,
        readinessTier,
        pricingScore,
        pricingPosition,
        submissionSpeedDays,
        reliabilityIndex,
        headlineRiskLevel,
      };
    });

    // Step 5: Compute core recommendation
    const coreRecommendation = computeCoreRecommendation(supplierSummaries, rfp);

    // Step 6: Build risk summary
    const riskSummary = buildRiskSummary(supplierResponses);

    // Step 7: Build timeline summary
    const timelineSummary = buildTimelineSummary(rfp);

    // Step 8: Create placeholder narrative (AI will overwrite)
    const narrative: DecisionBriefNarrative = {
      executiveSummary: "AI-generated executive summary will appear here after generation.",
      procurementNotes: "AI-generated procurement notes will appear here after generation.",
      itNotes: "AI-generated IT notes will appear here after generation.",
      financeNotes: "AI-generated finance notes will appear here after generation.",
    };

    // Step 9: Assemble final snapshot
    const snapshot: DecisionBriefSnapshot = {
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      rfpOwnerName: rfp.user?.name || null,
      rfpBudget: rfp.budget,
      rfpStatus: rfp.status,
      rfpStage: rfp.stage,
      coreRecommendation,
      supplierSummaries,
      riskSummary,
      timelineSummary,
      narrative,
      generatedAt: new Date().toISOString(),
      generatedByUserId: rfp.userId,
      generatedUsingAI: false, // Will be set to true when AI enriches narrative
      version: 1,
      audiences: ["executive"], // Default audience
    };

    return snapshot;
  } catch (error) {
    console.error('Error composing decision brief:', error);
    
    // Return a safe fallback snapshot on error
    return createFallbackSnapshot(rfpId);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getReadinessTier(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 80) return "Ready";
  if (score >= 60) return "Conditional";
  return "Not Ready";
}

function getPricingPosition(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 80) return "Highly Competitive";
  if (score >= 60) return "Competitive";
  if (score >= 40) return "Moderate";
  return "High";
}

function calculateReliabilityIndex(
  finalScore: number | null,
  readinessScore: number | null,
  pricingScore: number | null
): number | null {
  const scores = [finalScore, readinessScore, pricingScore].filter(s => s !== null) as number[];
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

function getHeadlineRiskLevel(riskFlags: any[]): "low" | "medium" | "high" {
  if (!riskFlags || riskFlags.length === 0) return "low";
  
  const highRisks = riskFlags.filter(r => r.severity === 'HIGH');
  const mediumRisks = riskFlags.filter(r => r.severity === 'MEDIUM');
  
  if (highRisks.length >= 2) return "high";
  if (highRisks.length === 1 || mediumRisks.length >= 3) return "medium";
  return "low";
}

function computeCoreRecommendation(
  supplierSummaries: DecisionBriefSupplierSummary[],
  rfp: any
): DecisionBriefCoreRecommendation {
  // Sort suppliers by final score descending
  const sortedSuppliers = [...supplierSummaries].sort((a, b) => {
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  if (sortedSuppliers.length === 0) {
    return {
      recommendedSupplierId: null,
      recommendedSupplierName: null,
      recommendationType: "no_recommendation",
      confidenceScore: 0,
      primaryRationaleBullets: [
        "No supplier responses have been submitted yet.",
      ],
    };
  }

  const topSupplier = sortedSuppliers[0];

  // Determine recommendation type based on multiple factors
  let recommendationType: DecisionBriefCoreRecommendation['recommendationType'] = "no_recommendation";
  let confidenceScore = 0;
  const rationale: string[] = [];

  // Check if top supplier meets quality threshold
  const hasGoodScore = (topSupplier.finalScore || 0) >= 70;
  const hasGoodReadiness = (topSupplier.readinessScore || 0) >= 60;
  const hasLowRisk = topSupplier.headlineRiskLevel !== "high";

  if (hasGoodScore && hasGoodReadiness && hasLowRisk) {
    recommendationType = "recommend_award";
    confidenceScore = Math.min(90, (topSupplier.finalScore || 70));
    rationale.push(`${topSupplier.supplierName} demonstrates strong overall performance with a score of ${topSupplier.finalScore}.`);
    rationale.push(`Readiness tier: ${topSupplier.readinessTier}, indicating capability to deliver.`);
    if (topSupplier.pricingPosition) {
      rationale.push(`Pricing position: ${topSupplier.pricingPosition}.`);
    }
  } else if (hasGoodScore && hasGoodReadiness) {
    recommendationType = "recommend_negotiation";
    confidenceScore = 65;
    rationale.push(`${topSupplier.supplierName} shows strong potential but has ${topSupplier.headlineRiskLevel} risk level.`);
    rationale.push(`Recommend further negotiation to address risk concerns before award.`);
  } else if ((topSupplier.finalScore || 0) < 50 || sortedSuppliers.every(s => (s.finalScore || 0) < 60)) {
    recommendationType = "recommend_rebid";
    confidenceScore = 40;
    rationale.push(`No suppliers meet the minimum quality threshold.`);
    rationale.push(`Consider rebidding with revised requirements or expanded supplier pool.`);
  } else {
    recommendationType = "recommend_negotiation";
    confidenceScore = 55;
    rationale.push(`${topSupplier.supplierName} is the leading candidate but requires additional evaluation.`);
    rationale.push(`Readiness or risk factors require clarification before final decision.`);
  }

  return {
    recommendedSupplierId: topSupplier.supplierId,
    recommendedSupplierName: topSupplier.supplierName,
    recommendationType,
    confidenceScore,
    primaryRationaleBullets: rationale,
  };
}

function buildRiskSummary(supplierResponses: any[]): DecisionBriefRiskSummary {
  const allRisks: string[] = [];
  const allMitigations: string[] = [];

  // Aggregate risks from all responses
  for (const response of supplierResponses) {
    const riskFlags = response.riskFlags as any[];
    if (riskFlags && Array.isArray(riskFlags)) {
      for (const risk of riskFlags) {
        if (risk.severity === 'HIGH' || risk.severity === 'MEDIUM') {
          allRisks.push(`${response.supplierContact.name}: ${risk.description}`);
          if (risk.mitigation) {
            allMitigations.push(risk.mitigation);
          }
        }
      }
    }
  }

  // Determine overall risk level
  const highRiskCount = supplierResponses.filter(r => {
    const flags = r.riskFlags as any[];
    return flags && flags.some(f => f.severity === 'HIGH');
  }).length;

  let overallRiskLevel: "low" | "medium" | "high" = "low";
  if (highRiskCount >= 2) overallRiskLevel = "high";
  else if (highRiskCount === 1 || allRisks.length >= 3) overallRiskLevel = "medium";

  return {
    overallRiskLevel,
    keyRisks: allRisks.slice(0, 5), // Top 5 risks
    mitigationActions: [...new Set(allMitigations)].slice(0, 5), // Dedupe and top 5
  };
}

function buildTimelineSummary(rfp: any): DecisionBriefTimelineSummary {
  const upcomingMilestones: Array<{
    label: string;
    date: string | null;
    daysRemaining: number | null;
  }> = [];

  const now = new Date();

  if (rfp.submissionEnd) {
    const daysRemaining = Math.ceil((new Date(rfp.submissionEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    upcomingMilestones.push({
      label: "Submission Deadline",
      date: rfp.submissionEnd.toISOString(),
      daysRemaining,
    });
  }

  if (rfp.demoWindowStart) {
    const daysRemaining = Math.ceil((new Date(rfp.demoWindowStart).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    upcomingMilestones.push({
      label: "Demo Window Opens",
      date: rfp.demoWindowStart.toISOString(),
      daysRemaining,
    });
  }

  if (rfp.awardDate) {
    const daysRemaining = Math.ceil((new Date(rfp.awardDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    upcomingMilestones.push({
      label: "Award Date",
      date: rfp.awardDate.toISOString(),
      daysRemaining,
    });
  }

  // Sort by days remaining
  upcomingMilestones.sort((a, b) => (a.daysRemaining || Infinity) - (b.daysRemaining || Infinity));

  // Generate suggested next steps based on current stage
  const suggestedNextSteps = generateNextSteps(rfp.stage, upcomingMilestones);

  return {
    currentStage: rfp.stage,
    upcomingMilestones: upcomingMilestones.slice(0, 3), // Top 3 milestones
    suggestedNextSteps,
  };
}

function generateNextSteps(stage: string, milestones: any[]): string[] {
  const steps: string[] = [];

  if (stage === 'SUBMISSION' && milestones.length > 0) {
    steps.push("Review all submitted supplier responses");
    steps.push("Schedule technical evaluation sessions");
    steps.push("Prepare for demo presentations if applicable");
  } else if (stage === 'EXEC_REVIEW') {
    steps.push("Present findings to executive stakeholders");
    steps.push("Obtain necessary approvals for next phase");
    steps.push("Plan negotiation strategy with top candidates");
  } else if (stage === 'DEBRIEF') {
    steps.push("Notify successful and unsuccessful suppliers");
    steps.push("Schedule contract negotiation");
    steps.push("Begin onboarding preparation");
  } else {
    steps.push("Continue monitoring RFP progress");
    steps.push("Engage with suppliers as needed");
    steps.push("Update stakeholders on timeline");
  }

  return steps.slice(0, 3);
}

function createFallbackSnapshot(rfpId: string): DecisionBriefSnapshot {
  return {
    rfpId,
    rfpTitle: "RFP Title Unavailable",
    rfpOwnerName: null,
    rfpBudget: null,
    rfpStatus: "unknown",
    rfpStage: "INTAKE",
    coreRecommendation: {
      recommendedSupplierId: null,
      recommendedSupplierName: null,
      recommendationType: "no_recommendation",
      confidenceScore: 0,
      primaryRationaleBullets: ["Unable to generate recommendation due to data access error."],
    },
    supplierSummaries: [],
    riskSummary: {
      overallRiskLevel: "medium",
      keyRisks: ["Data access error prevented risk analysis."],
      mitigationActions: ["Retry brief generation after resolving system issues."],
    },
    timelineSummary: {
      currentStage: "INTAKE",
      upcomingMilestones: [],
      suggestedNextSteps: ["Verify RFP data and retry brief generation."],
    },
    narrative: {
      executiveSummary: "Unable to generate executive summary.",
      procurementNotes: "Unable to generate procurement notes.",
      itNotes: "Unable to generate IT notes.",
      financeNotes: "Unable to generate finance notes.",
    },
    generatedAt: new Date().toISOString(),
    generatedByUserId: null,
    generatedUsingAI: false,
    version: 0,
    audiences: ["executive"],
  };
}
