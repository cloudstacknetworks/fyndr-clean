/**
 * Opportunity Scoring Engine
 * STEP 13: Internal Qualification Score
 * 
 * This module provides types, weights, and calculation logic for scoring RFP opportunities.
 * All scores are in the range 0-100.
 */

// ================================
// Types
// ================================

export type OpportunityScoreDimension =
  | 'strategicFit'
  | 'solutionFit'
  | 'competitiveAdvantage'
  | 'budgetAlignment'
  | 'timelineFeasibility'
  | 'winProbability'
  | 'internalReadiness'
  | 'riskScore';

export interface DimensionScore {
  score: number;
  rationale: string;
}

export interface OpportunityScoreBreakdown {
  strategicFit: DimensionScore;
  solutionFit: DimensionScore;
  competitiveAdvantage: DimensionScore;
  budgetAlignment: DimensionScore;
  timelineFeasibility: DimensionScore;
  winProbability: DimensionScore;
  internalReadiness: DimensionScore;
  riskScore: DimensionScore;
  overallComment?: string;
}

// ================================
// Constants
// ================================

/**
 * Weights for each scoring dimension (must sum to 1.0)
 */
export const WEIGHTS: Record<OpportunityScoreDimension, number> = {
  strategicFit: 0.15,
  solutionFit: 0.15,
  competitiveAdvantage: 0.15,
  budgetAlignment: 0.10,
  timelineFeasibility: 0.10,
  winProbability: 0.20,
  internalReadiness: 0.10,
  riskScore: 0.05,
};

/**
 * Dimension labels for UI display
 */
export const DIMENSION_LABELS: Record<OpportunityScoreDimension, string> = {
  strategicFit: 'Strategic Fit',
  solutionFit: 'Solution Fit',
  competitiveAdvantage: 'Competitive Advantage',
  budgetAlignment: 'Budget Alignment',
  timelineFeasibility: 'Timeline Feasibility',
  winProbability: 'Win Probability',
  internalReadiness: 'Internal Readiness',
  riskScore: 'Risk Score',
};

/**
 * Dimension descriptions
 */
export const DIMENSION_DESCRIPTIONS: Record<OpportunityScoreDimension, string> = {
  strategicFit: 'How well this opportunity aligns with our overall strategy',
  solutionFit: 'How well the solution fits the requirements',
  competitiveAdvantage: 'How strong our differentiation is',
  budgetAlignment: 'Budget fit vs. our expectations',
  timelineFeasibility: 'Can we realistically meet the timeline?',
  winProbability: 'Estimated likelihood of winning',
  internalReadiness: 'Do we have resources/bandwidth to execute?',
  riskScore: 'Overall risk (Higher = riskier; inverted in scoring)',
};

// ================================
// Helper Functions
// ================================

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validates that a breakdown has all required dimensions
 */
export function validateBreakdown(breakdown: any): breakdown is OpportunityScoreBreakdown {
  const requiredDimensions: OpportunityScoreDimension[] = [
    'strategicFit',
    'solutionFit',
    'competitiveAdvantage',
    'budgetAlignment',
    'timelineFeasibility',
    'winProbability',
    'internalReadiness',
    'riskScore',
  ];

  for (const dimension of requiredDimensions) {
    if (!breakdown[dimension]) {
      return false;
    }
    if (typeof breakdown[dimension].score !== 'number') {
      return false;
    }
    if (typeof breakdown[dimension].rationale !== 'string') {
      return false;
    }
  }

  return true;
}

// ================================
// Core Calculation Function
// ================================

/**
 * Calculates the weighted opportunity score from a breakdown
 * 
 * @param breakdown - The score breakdown with all dimensions
 * @returns The weighted total score (0-100, rounded to nearest integer)
 */
export function calculateWeightedOpportunityScore(
  breakdown: OpportunityScoreBreakdown
): number {
  let totalScore = 0;

  // Process each dimension
  const dimensions: OpportunityScoreDimension[] = [
    'strategicFit',
    'solutionFit',
    'competitiveAdvantage',
    'budgetAlignment',
    'timelineFeasibility',
    'winProbability',
    'internalReadiness',
    'riskScore',
  ];

  for (const dimension of dimensions) {
    const dimensionScore = breakdown[dimension];
    
    // Clamp the score to 0-100 range
    let score = clamp(dimensionScore.score, 0, 100);
    
    // For riskScore, invert it (higher risk = lower contribution to opportunity)
    if (dimension === 'riskScore') {
      score = 100 - score;
    }
    
    // Apply weight and add to total
    const weight = WEIGHTS[dimension];
    totalScore += score * weight;
  }

  // Round to nearest integer
  return Math.round(totalScore);
}

// ================================
// Risk Rating Helpers
// ================================

export type OpportunityRating = 'high' | 'medium' | 'low';

export interface OpportunityRatingInfo {
  rating: OpportunityRating;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

/**
 * Gets the risk rating and styling info for a given score
 */
export function getOpportunityRating(score: number): OpportunityRatingInfo {
  if (score >= 80) {
    return {
      rating: 'high',
      label: 'High Opportunity',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    };
  } else if (score >= 50) {
    return {
      rating: 'medium',
      label: 'Medium Opportunity',
      color: 'amber',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
    };
  } else {
    return {
      rating: 'low',
      label: 'Low Opportunity',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    };
  }
}
