/**
 * STEP 39: Requirement-Level Scoring Matrix - TypeScript Type Definitions
 * 
 * This file defines all the types for the scoring matrix system,
 * including requirements, cells, suppliers, and the overall snapshot structure.
 */

// ===========================
// REQUIREMENT CATEGORIES
// ===========================

/**
 * Categorization of requirements by their functional area
 */
export type RequirementCategoryId = 
  | "functional" 
  | "commercial" 
  | "legal" 
  | "security" 
  | "operational" 
  | "other";

/**
 * Importance level for a requirement (affects weighting)
 */
export type RequirementImportance = 
  | "must_have" 
  | "should_have" 
  | "nice_to_have";

/**
 * Score level for how well a supplier meets a requirement
 */
export type RequirementScoreLevel = 
  | "pass"           // Fully meets requirement
  | "partial"        // Partially meets requirement
  | "fail"           // Does not meet requirement
  | "not_applicable" // Requirement not applicable
  | "missing";       // Response absent or non-parsed

// ===========================
// REQUIREMENT DEFINITION
// ===========================

/**
 * Represents a single requirement (question or clause) in the matrix
 */
export interface ScoringMatrixRequirement {
  requirementId: string;
  
  /**
   * Source of the requirement
   * - template_question: From RFP template structure
   * - clause: From linked clause library
   */
  sourceType: "template_question" | "clause";
  
  /**
   * Unique reference key for tracking
   * Examples: "SECTION:SUBSECTION:QUESTION" or clause shortCode
   */
  referenceKey: string;
  
  /** Short display label */
  shortLabel: string;
  
  /** Full requirement description */
  longDescription: string;
  
  /** Category for grouping and filtering */
  category: RequirementCategoryId;
  
  /** Importance level (affects default weight) */
  importance: RequirementImportance;
  
  /** Default weight (0-1) used in scoring */
  defaultWeight: number;
}

// ===========================
// SCORING CELLS
// ===========================

/**
 * Represents how a specific supplier scores on a specific requirement
 */
export interface ScoringMatrixCell {
  requirementId: string;
  supplierId: string;
  
  /** Qualitative score level */
  scoreLevel: RequirementScoreLevel;
  
  /** Numeric score (0-1) for calculations */
  numericScore: number;
  
  /** Optional justification/explanation for the score */
  justification?: string;
}

// ===========================
// SUPPLIER SUMMARY
// ===========================

/**
 * Aggregated scores and compliance data for a single supplier
 */
export interface ScoringMatrixSupplierSummary {
  supplierId: string;
  supplierName: string;
  
  /** Unweighted average score (0-100) */
  overallScore: number;
  
  /** Weighted score considering importance and category (0-100) */
  weightedScore: number;
  
  /** Breakdown of scores by category */
  categoryScores: Array<{
    category: RequirementCategoryId;
    score: number;
    weightedScore: number;
  }>;
  
  /** Compliance with must-have requirements */
  mustHaveCompliance: {
    total: number;
    passed: number;
    failed: number;
  };
}

// ===========================
// SCORING CONFIGURATION
// ===========================

/**
 * Configuration for how scores are calculated
 */
export interface ScoringConfig {
  /** Default weights for each category (0-1) */
  defaultWeights: {
    [category in RequirementCategoryId]?: number;
  };
  
  /** Penalty applied when must-have requirements fail (e.g., -10 points) */
  mustHavePenalty: number;
  
  /** Factor for partial scores (e.g., 0.5 for 50% credit) */
  partialFactor: number;
}

// ===========================
// COMPLETE SNAPSHOT
// ===========================

/**
 * Complete scoring matrix snapshot for an RFP
 * This is stored in RFP.scoringMatrixSnapshot
 */
export interface ScoringMatrixSnapshot {
  rfpId: string;
  
  /** Timestamp of when this snapshot was generated */
  generatedAt: Date;
  
  /** User ID who triggered generation (optional) */
  generatedByUserId?: string;
  
  /** List of all requirements in the matrix */
  requirements: ScoringMatrixRequirement[];
  
  /** All scoring cells (requirements × suppliers) */
  cells: ScoringMatrixCell[];
  
  /** Summary data for each supplier */
  supplierSummaries: ScoringMatrixSupplierSummary[];
  
  /** Configuration used for scoring */
  scoringConfig: ScoringConfig;
  
  /** Metadata about the snapshot */
  meta: {
    totalRequirements: number;
    totalSuppliers: number;
    version: number;
  };
}

// ===========================
// DEFAULT CONFIGURATION
// ===========================

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  defaultWeights: {
    functional: 1.0,
    commercial: 0.9,
    legal: 0.95,
    security: 1.0,
    operational: 0.8,
    other: 0.6
  },
  mustHavePenalty: 10, // Subtract 10 points per failed must_have
  partialFactor: 0.5   // Partial = 50% credit
};

// ===========================
// HELPER TYPES
// ===========================

/**
 * Options for building/recomputing a scoring matrix
 */
export interface BuildMatrixOptions {
  forceRecompute?: boolean;
  scoringConfigOverrides?: Partial<ScoringConfig>;
  userId?: string;
}

/**
 * Filter options for the matrix UI
 */
export interface MatrixFilters {
  category?: RequirementCategoryId | "all";
  onlyDifferentiators?: boolean;
  onlyFailedOrPartial?: boolean;
  searchTerm?: string;
}
