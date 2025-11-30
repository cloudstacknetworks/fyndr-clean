/**
 * Supplier Comparison Engine (STEP 18)
 * 
 * Provides weighted scoring, normalization, and comparison logic for supplier responses.
 */

import { PrismaClient, SupplierResponse } from '@prisma/client';

const prisma = new PrismaClient();

// Default weights (Option C Fallback)
export const DEFAULT_WEIGHTS = {
  requirementsCoverage: 30,
  pricingCompetitiveness: 25,
  technicalStrength: 15,
  differentiators: 10,
  riskProfile: 10, // inverse
  assumptionsQuality: 5, // inverse
  demoQuality: 5,
};

// Type definitions
export interface BaseMetrics {
  requirementsCoverage: number;
  pricingCompetitiveness: number;
  technicalStrength: number;
  differentiators: number;
  riskProfile: number;
  assumptionsQuality: number;
  demoQuality: number;
}

export interface NormalizedMetrics extends BaseMetrics {
  totalCost?: number;
}

export interface ComparisonBreakdown {
  metrics: NormalizedMetrics;
  weightedScores: Record<keyof BaseMetrics, number>;
  totalScore: number;
  supplierName: string;
  supplierEmail: string;
  organization?: string;
}

/**
 * Extract base metrics from a supplier response's extracted data
 */
export function computeBaseMetricsFromExtraction(
  supplierResponse: SupplierResponse & {
    supplierContact: {
      name: string;
      email: string;
      organization: string | null;
    };
  }
): BaseMetrics & { totalCost?: number; supplierName: string; supplierEmail: string; organization?: string } {
  const {
    extractedRequirementsCoverage,
    extractedPricing,
    extractedTechnicalClaims,
    extractedDifferentiators,
    extractedRisks,
    extractedAssumptions,
    extractedDemoSummary,
  } = supplierResponse;

  // Requirements Coverage (0-100)
  let requirementsCoverage = 0;
  if (extractedRequirementsCoverage && typeof extractedRequirementsCoverage === 'object') {
    const coverage = extractedRequirementsCoverage as any;
    requirementsCoverage = coverage.coveragePercentage || 0;
  }

  // Pricing (extract total cost for normalization later)
  let totalCost: number | undefined = undefined;
  if (extractedPricing && typeof extractedPricing === 'object') {
    const pricing = extractedPricing as any;
    totalCost = pricing.totalCost || pricing.estimatedTotal || undefined;
  }

  // Technical Strength (0-100 based on count and depth of claims)
  let technicalStrength = 0;
  if (extractedTechnicalClaims && typeof extractedTechnicalClaims === 'object') {
    const claims = extractedTechnicalClaims as any;
    const claimsArray = claims.claims || [];
    const claimsCount = Array.isArray(claimsArray) ? claimsArray.length : 0;
    // Score: 10 points per claim, max 100
    technicalStrength = Math.min(claimsCount * 10, 100);
  }

  // Differentiators (0-100 based on count and uniqueness)
  let differentiators = 0;
  if (extractedDifferentiators && typeof extractedDifferentiators === 'object') {
    const diffs = extractedDifferentiators as any;
    const diffsArray = diffs.differentiators || [];
    const diffsCount = Array.isArray(diffsArray) ? diffsArray.length : 0;
    // Score: 15 points per differentiator, max 100
    differentiators = Math.min(diffsCount * 15, 100);
  }

  // Risk Profile (0-100, inverse - fewer/lower severity risks = higher score)
  let riskProfile = 100;
  if (extractedRisks && typeof extractedRisks === 'object') {
    const risks = extractedRisks as any;
    const risksArray = risks.risks || [];
    const risksCount = Array.isArray(risksArray) ? risksArray.length : 0;
    // Deduct 10 points per risk, min 0
    riskProfile = Math.max(100 - risksCount * 10, 0);
  }

  // Assumptions Quality (0-100, inverse - fewer assumptions = higher score)
  let assumptionsQuality = 100;
  if (extractedAssumptions && typeof extractedAssumptions === 'object') {
    const assumptions = extractedAssumptions as any;
    const assumptionsArray = assumptions.assumptions || [];
    const assumptionsCount = Array.isArray(assumptionsArray) ? assumptionsArray.length : 0;
    // Deduct 10 points per assumption, min 0
    assumptionsQuality = Math.max(100 - assumptionsCount * 10, 0);
  }

  // Demo Quality (0-100 based on capabilities vs gaps)
  let demoQuality = 50; // default to 50 if no demo data
  if (extractedDemoSummary && typeof extractedDemoSummary === 'object') {
    const demo = extractedDemoSummary as any;
    const keyCapabilities = demo.keyCapabilities || [];
    const gaps = demo.gaps || [];
    const capabilitiesCount = Array.isArray(keyCapabilities) ? keyCapabilities.length : 0;
    const gapsCount = Array.isArray(gaps) ? gaps.length : 0;
    // Score: 10 points per capability, -10 per gap, range 0-100
    demoQuality = Math.max(0, Math.min(100, 50 + capabilitiesCount * 10 - gapsCount * 10));
  }

  return {
    requirementsCoverage,
    pricingCompetitiveness: 0, // will be normalized later
    technicalStrength,
    differentiators,
    riskProfile,
    assumptionsQuality,
    demoQuality,
    totalCost,
    supplierName: supplierResponse.supplierContact.name,
    supplierEmail: supplierResponse.supplierContact.email,
    organization: supplierResponse.supplierContact.organization || undefined,
  };
}

/**
 * Normalize scores across all suppliers (0-100 scale)
 */
export function normalizeScoresAcrossSuppliers(
  suppliers: Array<ReturnType<typeof computeBaseMetricsFromExtraction>>
): Array<NormalizedMetrics & { supplierName: string; supplierEmail: string; organization?: string }> {
  if (suppliers.length === 0) return [];

  // Find min/max for each metric
  const metrics: (keyof BaseMetrics)[] = [
    'requirementsCoverage',
    'technicalStrength',
    'differentiators',
    'riskProfile',
    'assumptionsQuality',
    'demoQuality',
  ];

  const minMax: Record<string, { min: number; max: number }> = {};

  metrics.forEach((metric) => {
    const values = suppliers.map((s) => s[metric]);
    minMax[metric] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  // Normalize pricing (inverse: lowest cost = highest score)
  const costsWithSuppliers = suppliers
    .map((s, idx) => ({ cost: s.totalCost, idx }))
    .filter((c) => c.cost !== undefined) as Array<{ cost: number; idx: number }>;

  let pricingScores: number[] = Array(suppliers.length).fill(50); // default 50 if no pricing

  if (costsWithSuppliers.length > 0) {
    const minCost = Math.min(...costsWithSuppliers.map((c) => c.cost));
    const maxCost = Math.max(...costsWithSuppliers.map((c) => c.cost));

    costsWithSuppliers.forEach(({ cost, idx }) => {
      if (maxCost === minCost) {
        pricingScores[idx] = 100; // all same price
      } else {
        // Inverse: best price gets 100, worst gets 0
        pricingScores[idx] = 100 - ((cost - minCost) / (maxCost - minCost)) * 100;
      }
    });
  }

  // Normalize all suppliers
  return suppliers.map((supplier, idx) => {
    const normalized: NormalizedMetrics = {
      requirementsCoverage: supplier.requirementsCoverage, // already 0-100
      pricingCompetitiveness: pricingScores[idx],
      technicalStrength: supplier.technicalStrength, // already 0-100
      differentiators: supplier.differentiators, // already 0-100
      riskProfile: supplier.riskProfile, // already 0-100 (inverse)
      assumptionsQuality: supplier.assumptionsQuality, // already 0-100 (inverse)
      demoQuality: supplier.demoQuality, // already 0-100
      totalCost: supplier.totalCost,
    };

    return {
      ...normalized,
      supplierName: supplier.supplierName,
      supplierEmail: supplier.supplierEmail,
      organization: supplier.organization,
    };
  });
}

/**
 * Calculate weighted score for a supplier
 */
export function computeWeightedScore(
  metrics: NormalizedMetrics,
  weights: Record<keyof BaseMetrics, number>
): { weightedScores: Record<keyof BaseMetrics, number>; totalScore: number } {
  const weightedScores: Record<keyof BaseMetrics, number> = {
    requirementsCoverage: (metrics.requirementsCoverage * weights.requirementsCoverage) / 100,
    pricingCompetitiveness: (metrics.pricingCompetitiveness * weights.pricingCompetitiveness) / 100,
    technicalStrength: (metrics.technicalStrength * weights.technicalStrength) / 100,
    differentiators: (metrics.differentiators * weights.differentiators) / 100,
    riskProfile: (metrics.riskProfile * weights.riskProfile) / 100,
    assumptionsQuality: (metrics.assumptionsQuality * weights.assumptionsQuality) / 100,
    demoQuality: (metrics.demoQuality * weights.demoQuality) / 100,
  };

  const totalScore = Math.round(
    Object.values(weightedScores).reduce((sum, score) => sum + score, 0)
  );

  return { weightedScores, totalScore };
}

/**
 * Build comparison breakdown for a supplier
 */
export function buildComparisonBreakdown(
  supplier: NormalizedMetrics & { supplierName: string; supplierEmail: string; organization?: string },
  weights: Record<keyof BaseMetrics, number>
): ComparisonBreakdown {
  const { weightedScores, totalScore } = computeWeightedScore(supplier, weights);

  return {
    metrics: supplier,
    weightedScores,
    totalScore,
    supplierName: supplier.supplierName,
    supplierEmail: supplier.supplierEmail,
    organization: supplier.organization,
  };
}

/**
 * Load evaluation matrix for an RFP if it exists
 */
export async function loadEvaluationMatrix(
  rfpId: string
): Promise<{ name: string; criteria: Array<{ id: string; label: string; weight: number }> } | null> {
  const matrix = await prisma.evaluationMatrix.findUnique({
    where: { rfpId },
  });

  if (!matrix) return null;

  return {
    name: matrix.name,
    criteria: matrix.criteria as Array<{ id: string; label: string; weight: number }>,
  };
}

/**
 * Convert evaluation matrix criteria to weights format
 */
export function matrixCriteriaToWeights(
  criteria: Array<{ id: string; label: string; weight: number }>
): Record<keyof BaseMetrics, number> {
  const weights: Record<keyof BaseMetrics, number> = { ...DEFAULT_WEIGHTS };

  criteria.forEach((criterion) => {
    if (criterion.id in weights) {
      weights[criterion.id as keyof BaseMetrics] = criterion.weight;
    }
  });

  return weights;
}
