/**
 * STEP 42: Supplier Debrief Pack Service
 * 
 * This service builds supplier-specific debrief data for post-award
 * supplier debriefs. It extracts relevant scoring, performance, and
 * feedback information from the RFP snapshots.
 * 
 * SCOPE: Buyer-only, pre-award workspace functionality.
 * SECURITY: Company-scoped, no supplier access.
 */

import { prisma } from "@/lib/prisma";

// ====================================================================
// TYPES
// ====================================================================

export interface SupplierDebriefData {
  rfpId: string;
  rfpTitle: string;
  supplierName: string;
  supplierId: string;
  
  // Scoring Details
  overallScore: number | null;
  weightedScore: number | null;
  rank: number | null; // 1-based rank among all suppliers
  
  // Category-Level Performance
  categoryPerformance: Array<{
    category: string;
    score: number | null;
    strengths: string[];
    improvements: string[];
  }>;
  
  // Must-Have Compliance
  mustHaveCompliance: {
    passed: number;
    failed: number;
    total: number;
    failedRequirements: string[]; // List of failed must-have requirements
  };
  
  // AI Narrative (from scoringMatrixSnapshot if available)
  aiNarrative: string | null;
  
  // Buyer Notes (from awardNotes if available)
  buyerNotes: string | null;
  
  // Award Outcome
  isSelected: boolean;
  awardStatus: string | null; // "awarded", "recommended", "not_selected", etc.
  
  // Meta
  generatedAt: string;
  rfpCreatedAt: string;
  rfpAwardedAt: string | null;
}

// ====================================================================
// MAIN SERVICE FUNCTION
// ====================================================================

/**
 * Builds supplier debrief data for a specific supplier in an RFP
 * 
 * @param rfpId - ID of the RFP
 * @param supplierId - ID of the supplier (from SupplierContact or Supplier)
 * @returns SupplierDebriefData object
 */
export async function buildSupplierDebriefData(
  rfpId: string,
  supplierId: string
): Promise<SupplierDebriefData> {
  // Load RFP with all necessary data
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      supplierResponses: {
        include: {
          supplierContact: true,
        },
      },
    },
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  // Find the supplier response for this supplier
  const supplierResponse = rfp.supplierResponses.find(
    (r) =>
      r.supplierContactId === supplierId ||
      r.id === supplierId
  );

  if (!supplierResponse) {
    throw new Error("Supplier not found in this RFP");
  }

  const supplierName =
    supplierResponse.supplierContact.organization ||
    supplierResponse.supplierContact.name ||
    "Unknown Supplier";

  // Parse scoringMatrixSnapshot
  const scoringMatrixSnapshot = rfp.scoringMatrixSnapshot
    ? typeof rfp.scoringMatrixSnapshot === "string"
      ? JSON.parse(rfp.scoringMatrixSnapshot)
      : rfp.scoringMatrixSnapshot
    : null;

  // Extract supplier data from scoring matrix
  const supplierSummary = scoringMatrixSnapshot?.supplierSummaries?.find(
    (s: any) =>
      s.supplierId === supplierId ||
      s.supplierId === supplierResponse.supplierContactId ||
      s.supplierId === supplierResponse.id
  );

  // Extract overall scores
  const overallScore = supplierSummary?.overallScore || supplierResponse.finalScore || null;
  const weightedScore = supplierSummary?.weightedScore || null;

  // Calculate rank
  const allSupplierScores = scoringMatrixSnapshot?.supplierSummaries || [];
  const sortedScores = allSupplierScores
    .map((s: any) => ({
      id: s.supplierId,
      score: s.weightedScore || s.overallScore || 0,
    }))
    .sort((a: any, b: any) => b.score - a.score);
  
  const rank = sortedScores.findIndex(
    (s: any) =>
      s.id === supplierId ||
      s.id === supplierResponse.supplierContactId ||
      s.id === supplierResponse.id
  ) + 1;

  // Extract category performance
  const categoryPerformance = extractCategoryPerformance(supplierSummary);

  // Extract must-have compliance
  const mustHaveCompliance = extractMustHaveCompliance(
    supplierSummary,
    scoringMatrixSnapshot
  );

  // Extract AI narrative
  const aiNarrative = extractAiNarrative(supplierSummary, supplierResponse);

  // Extract buyer notes from awardNotes if this supplier is selected
  const buyerNotes = rfp.awardNotes || null;

  // Determine if this supplier is the selected one
  const isSelected = rfp.awardedSupplierId === supplierResponse.supplierContactId ||
                     rfp.awardedSupplierId === supplierId;

  // Determine award status
  const awardStatus = supplierResponse.awardOutcomeStatus || 
                     (isSelected ? rfp.awardStatus : "not_selected");

  return {
    rfpId: rfp.id,
    rfpTitle: rfp.title,
    supplierName,
    supplierId: supplierResponse.supplierContactId,
    overallScore,
    weightedScore,
    rank: rank > 0 ? rank : null,
    categoryPerformance,
    mustHaveCompliance,
    aiNarrative,
    buyerNotes: isSelected ? buyerNotes : null, // Only include buyer notes for selected supplier
    isSelected,
    awardStatus,
    generatedAt: new Date().toISOString(),
    rfpCreatedAt: rfp.createdAt.toISOString(),
    rfpAwardedAt: rfp.awardDecidedAt?.toISOString() || null,
  };
}

// ====================================================================
// INTERNAL HELPER FUNCTIONS
// ====================================================================

/**
 * Extracts category-level performance data
 */
function extractCategoryPerformance(supplierSummary: any): Array<{
  category: string;
  score: number | null;
  strengths: string[];
  improvements: string[];
}> {
  if (!supplierSummary || !supplierSummary.categoryScores) {
    return [];
  }

  return supplierSummary.categoryScores.map((cat: any) => {
    // Try to extract strengths and improvements from various sources
    const strengths = cat.strengths || cat.positives || [];
    const improvements = cat.improvements || cat.weaknesses || cat.gaps || [];

    // Derive strengths and improvements from score if not available
    const derivedFeedback = deriveStrengthsAndImprovements(cat.category, cat.score);

    return {
      category: cat.category,
      score: cat.score || null,
      strengths: strengths.length > 0 ? strengths : derivedFeedback.strengths,
      improvements: improvements.length > 0 ? improvements : derivedFeedback.improvements,
    };
  });
}

/**
 * Derives strengths and improvements based on category and score
 */
function deriveStrengthsAndImprovements(
  category: string,
  score: number | null
): {
  strengths: string[];
  improvements: string[];
} {
  if (score === null) {
    return {
      strengths: [],
      improvements: ["No scoring data available for this category."],
    };
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (score >= 80) {
    strengths.push(`Strong performance in ${category} requirements (${score.toFixed(0)}% score).`);
  } else if (score >= 60) {
    strengths.push(`Adequate performance in ${category} requirements (${score.toFixed(0)}% score).`);
    improvements.push(`Consider enhancing ${category} capabilities to achieve higher scores.`);
  } else {
    improvements.push(`Significant gaps in ${category} requirements (${score.toFixed(0)}% score).`);
    improvements.push(`Focus on strengthening ${category} competencies for future opportunities.`);
  }

  return { strengths, improvements };
}

/**
 * Extracts must-have compliance data
 */
function extractMustHaveCompliance(
  supplierSummary: any,
  scoringMatrixSnapshot: any
): {
  passed: number;
  failed: number;
  total: number;
  failedRequirements: string[];
} {
  const defaultCompliance = {
    passed: 0,
    failed: 0,
    total: 0,
    failedRequirements: [],
  };

  if (!supplierSummary || !supplierSummary.mustHaveCompliance) {
    return defaultCompliance;
  }

  const mustHaveData = supplierSummary.mustHaveCompliance;
  const passed = mustHaveData.passed || 0;
  const failed = mustHaveData.failed || 0;
  const total = mustHaveData.total || passed + failed;

  // Extract failed requirement labels
  const failedRequirements: string[] = [];
  if (scoringMatrixSnapshot?.cells && scoringMatrixSnapshot?.requirements) {
    const mustHaveRequirements = scoringMatrixSnapshot.requirements.filter(
      (r: any) => r.importance === "must_have"
    );

    mustHaveRequirements.forEach((req: any) => {
      const cell = scoringMatrixSnapshot.cells.find(
        (c: any) =>
          c.requirementId === req.requirementId &&
          c.supplierId === supplierSummary.supplierId
      );

      if (cell && (cell.scoreLevel === "fail" || cell.scoreLevel === "partial")) {
        failedRequirements.push(req.shortLabel || req.referenceKey || "Unknown Requirement");
      }
    });
  }

  return {
    passed,
    failed,
    total,
    failedRequirements,
  };
}

/**
 * Extracts AI narrative for the supplier
 * Tries multiple sources in order of preference
 */
function extractAiNarrative(
  supplierSummary: any,
  supplierResponse: any
): string | null {
  // 1. Try supplierSummary.narrative from scoringMatrixSnapshot
  if (supplierSummary?.narrative && typeof supplierSummary.narrative === "string") {
    return supplierSummary.narrative;
  }

  // 2. Try supplierSummary.aiSummary
  if (supplierSummary?.aiSummary && typeof supplierSummary.aiSummary === "string") {
    return supplierSummary.aiSummary;
  }

  // 3. Try to build a narrative from category scores
  if (supplierSummary?.categoryScores && supplierSummary.categoryScores.length > 0) {
    return buildNarrativeFromCategoryScores(supplierSummary);
  }

  // 4. Try supplierResponse.aiSummary
  if (supplierResponse?.aiSummary && typeof supplierResponse.aiSummary === "string") {
    return supplierResponse.aiSummary;
  }

  // 5. Graceful fallback
  return "No AI narrative available. Please contact the buyer for detailed feedback.";
}

/**
 * Builds a basic narrative from category scores
 */
function buildNarrativeFromCategoryScores(supplierSummary: any): string {
  const categoryScores = supplierSummary.categoryScores || [];
  const overallScore = supplierSummary.overallScore || supplierSummary.weightedScore || 0;

  let narrative = `Overall Performance: ${overallScore.toFixed(1)}%\n\n`;

  narrative += "Category Breakdown:\n";
  categoryScores.forEach((cat: any) => {
    const score = cat.score || 0;
    const level = score >= 80 ? "Strong" : score >= 60 ? "Adequate" : "Needs Improvement";
    narrative += `- ${cat.category}: ${score.toFixed(1)}% (${level})\n`;
  });

  return narrative;
}

/**
 * Lists all suppliers eligible for debrief in an RFP
 */
export async function listSuppliersForDebrief(rfpId: string): Promise<
  Array<{
    supplierId: string;
    supplierName: string;
    hasScoring: boolean;
  }>
> {
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      supplierResponses: {
        include: {
          supplierContact: true,
        },
      },
    },
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  const scoringMatrixSnapshot = rfp.scoringMatrixSnapshot
    ? typeof rfp.scoringMatrixSnapshot === "string"
      ? JSON.parse(rfp.scoringMatrixSnapshot)
      : rfp.scoringMatrixSnapshot
    : null;

  return rfp.supplierResponses.map((response) => {
    const supplierName =
      response.supplierContact.organization ||
      response.supplierContact.name ||
      "Unknown Supplier";

    const hasScoring = scoringMatrixSnapshot?.supplierSummaries?.some(
      (s: any) =>
        s.supplierId === response.supplierContactId ||
        s.supplierId === response.id
    ) || false;

    return {
      supplierId: response.supplierContactId,
      supplierName,
      hasScoring,
    };
  });
}
