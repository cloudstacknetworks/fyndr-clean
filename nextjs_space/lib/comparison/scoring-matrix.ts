/**
 * STEP 39: Requirement-Level Scoring Matrix - Core Scoring Engine
 * 
 * This file implements the core logic for building, retrieving, and exporting
 * requirement-level scoring matrices for RFPs.
 * 
 * Core Functions:
 * 1. buildScoringMatrix() - Builds a complete scoring matrix from scratch
 * 2. getScoringMatrix() - Retrieves matrix (from cache or recomputes)
 * 3. exportMatrixToCSV() - Exports matrix to CSV format
 */

import { PrismaClient, RFP, SupplierContact, SupplierResponse } from '@prisma/client';
import {
  ScoringMatrixSnapshot,
  ScoringMatrixRequirement,
  ScoringMatrixCell,
  ScoringMatrixSupplierSummary,
  ScoringConfig,
  DEFAULT_SCORING_CONFIG,
  RequirementCategoryId,
  RequirementImportance,
  RequirementScoreLevel,
  BuildMatrixOptions,
  MatrixFilters,
} from './scoring-matrix-types';

const prisma = new PrismaClient();

// ===========================
// CORE FUNCTION 1: BUILD MATRIX
// ===========================

/**
 * Builds a complete scoring matrix from scratch for a given RFP
 * 
 * @param rfpId - The RFP ID to build the matrix for
 * @param options - Options for matrix generation
 * @returns Complete scoring matrix snapshot
 */
export async function buildScoringMatrix(
  rfpId: string,
  options: BuildMatrixOptions = {}
): Promise<ScoringMatrixSnapshot> {
  // 1. Fetch RFP with all related data
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      template: true,
      supplierContacts: {
        where: {
          invitationStatus: 'ACCEPTED',
        },
      },
      supplierResponses: {
        include: {
          supplierContact: true,
        },
      },
    },
  });

  if (!rfp) {
    throw new Error(`RFP ${rfpId} not found`);
  }

  // 2. Extract requirements from template + clauses
  const requirements = await extractRequirements(rfp);

  // 3. Build scoring cells (requirements × suppliers)
  const cells = await buildScoringCells(rfp, requirements);

  // 4. Calculate supplier summaries
  const scoringConfig: ScoringConfig = {
    ...DEFAULT_SCORING_CONFIG,
    ...(options.scoringConfigOverrides || {}),
  };
  const supplierSummaries = calculateSupplierSummaries(requirements, cells, scoringConfig);

  // 5. Assemble snapshot
  const snapshot: ScoringMatrixSnapshot = {
    rfpId,
    generatedAt: new Date(),
    generatedByUserId: options.userId,
    requirements,
    cells,
    supplierSummaries,
    scoringConfig,
    meta: {
      totalRequirements: requirements.length,
      totalSuppliers: supplierSummaries.length,
      version: 1,
    },
  };

  // 6. Persist to database
  await prisma.rFP.update({
    where: { id: rfpId },
    data: {
      scoringMatrixSnapshot: snapshot as any,
    },
  });

  return snapshot;
}

// ===========================
// CORE FUNCTION 2: GET MATRIX
// ===========================

/**
 * Retrieves a scoring matrix for an RFP
 * 
 * @param rfpId - The RFP ID to retrieve the matrix for
 * @param fromCache - Whether to use cached snapshot (default true)
 * @returns Scoring matrix snapshot or null if not found
 */
export async function getScoringMatrix(
  rfpId: string,
  fromCache: boolean = true
): Promise<ScoringMatrixSnapshot | null> {
  // 1. Try to fetch from cache if requested
  if (fromCache) {
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { scoringMatrixSnapshot: true },
    });

    if (rfp?.scoringMatrixSnapshot) {
      return rfp.scoringMatrixSnapshot as unknown as ScoringMatrixSnapshot;
    }
  }

  // 2. If not in cache or forced recompute, build from scratch
  try {
    return await buildScoringMatrix(rfpId);
  } catch (error) {
    console.error(`Failed to build scoring matrix for RFP ${rfpId}:`, error);
    return null;
  }
}

// ===========================
// CORE FUNCTION 3: EXPORT TO CSV
// ===========================

/**
 * Exports a scoring matrix to CSV format
 * 
 * @param rfpId - The RFP ID to export
 * @param filters - Optional filters to apply
 * @returns CSV string
 */
export async function exportMatrixToCSV(
  rfpId: string,
  filters?: MatrixFilters
): Promise<string> {
  const matrix = await getScoringMatrix(rfpId);
  if (!matrix) {
    throw new Error(`No scoring matrix found for RFP ${rfpId}`);
  }

  // Apply filters
  let filteredRequirements = [...matrix.requirements];
  if (filters) {
    filteredRequirements = applyFilters(filteredRequirements, matrix.cells, filters);
  }

  // Build CSV header
  const supplierNames = matrix.supplierSummaries.map(s => s.supplierName);
  const headerRow = [
    'Requirement ID',
    'Category',
    'Importance',
    'Short Label',
    'Description',
    ...supplierNames.map(name => `${name} - Score`),
    ...supplierNames.map(name => `${name} - Justification`),
  ];

  // Build CSV rows
  const rows: string[][] = [headerRow];
  for (const req of filteredRequirements) {
    const row: string[] = [
      req.requirementId,
      req.category,
      req.importance,
      req.shortLabel,
      req.longDescription,
    ];

    // Add scores and justifications for each supplier
    for (const summary of matrix.supplierSummaries) {
      const cell = matrix.cells.find(
        c => c.requirementId === req.requirementId && c.supplierId === summary.supplierId
      );
      row.push(cell ? cell.scoreLevel : 'missing');
    }
    for (const summary of matrix.supplierSummaries) {
      const cell = matrix.cells.find(
        c => c.requirementId === req.requirementId && c.supplierId === summary.supplierId
      );
      row.push(cell?.justification || '');
    }

    rows.push(row);
  }

  // Convert to CSV string
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Extracts all requirements from RFP template and linked clauses
 */
async function extractRequirements(rfp: RFP & { template: any }): Promise<ScoringMatrixRequirement[]> {
  const requirements: ScoringMatrixRequirement[] = [];

  // 1. Extract from template structure
  if (rfp.appliedTemplateSnapshot && typeof rfp.appliedTemplateSnapshot === 'object') {
    const templateSnapshot = rfp.appliedTemplateSnapshot as any;
    if (templateSnapshot.sections && Array.isArray(templateSnapshot.sections)) {
      for (const section of templateSnapshot.sections) {
        if (section.subsections && Array.isArray(section.subsections)) {
          for (const subsection of section.subsections) {
            if (subsection.questions && Array.isArray(subsection.questions)) {
              for (const question of subsection.questions) {
                requirements.push({
                  requirementId: question.id || `${section.shortCode}:${subsection.shortCode}:${question.order}`,
                  sourceType: 'template_question',
                  referenceKey: `${section.shortCode}:${subsection.shortCode}:Q${question.order}`,
                  shortLabel: question.shortLabel || subsection.title || section.title,
                  longDescription: question.text || '',
                  category: mapSectionToCategory(section.shortCode || section.title),
                  importance: mapWeightToImportance(question.weight || 0),
                  defaultWeight: question.weight || 1.0,
                });
              }
            }
          }
        }
      }
    }
  }

  // 2. Extract from applied clauses
  if (rfp.appliedClausesSnapshot && typeof rfp.appliedClausesSnapshot === 'object') {
    const clausesSnapshot = rfp.appliedClausesSnapshot as any;
    if (clausesSnapshot.clauses && Array.isArray(clausesSnapshot.clauses)) {
      for (const clause of clausesSnapshot.clauses) {
        requirements.push({
          requirementId: clause.id || clause.shortCode,
          sourceType: 'clause',
          referenceKey: clause.shortCode,
          shortLabel: clause.shortLabel || clause.title,
          longDescription: clause.fullText || clause.description || '',
          category: mapClauseTypeToCategory(clause.clauseType || 'OTHER'),
          importance: mapMandatoryToImportance(clause.isMandatory),
          defaultWeight: clause.isMandatory ? 1.0 : 0.8,
        });
      }
    }
  }

  return requirements;
}

/**
 * Builds scoring cells by analyzing supplier responses against requirements
 */
async function buildScoringCells(
  rfp: RFP & { supplierResponses: any[] },
  requirements: ScoringMatrixRequirement[]
): Promise<ScoringMatrixCell[]> {
  const cells: ScoringMatrixCell[] = [];

  for (const supplierResponse of rfp.supplierResponses) {
    const supplierId = supplierResponse.supplierContactId;

    for (const requirement of requirements) {
      // Score this supplier against this requirement
      const cell = await scoreSupplierOnRequirement(
        supplierResponse,
        requirement
      );
      cells.push({
        requirementId: requirement.requirementId,
        supplierId,
        scoreLevel: cell.scoreLevel,
        numericScore: cell.numericScore,
        justification: cell.justification,
      });
    }
  }

  return cells;
}

/**
 * Scores a single supplier response against a single requirement
 */
async function scoreSupplierOnRequirement(
  supplierResponse: SupplierResponse,
  requirement: ScoringMatrixRequirement
): Promise<{ scoreLevel: RequirementScoreLevel; numericScore: number; justification?: string }> {
  // Extract parsed sections from supplier response
  const extractedData = supplierResponse.extractedRequirementsCoverage as any;
  
  if (!extractedData || !extractedData.requirements || !Array.isArray(extractedData.requirements)) {
    return {
      scoreLevel: 'missing',
      numericScore: 0,
      justification: 'No parsed requirements data found',
    };
  }

  // Find matching requirement in extracted data
  const matchedRequirement = extractedData.requirements.find(
    (r: any) => r.requirementId === requirement.requirementId || r.referenceKey === requirement.referenceKey
  );

  if (!matchedRequirement) {
    return {
      scoreLevel: 'missing',
      numericScore: 0,
      justification: 'Requirement not addressed in response',
    };
  }

  // Determine score based on coverage status
  let scoreLevel: RequirementScoreLevel = 'fail';
  let numericScore = 0;

  if (matchedRequirement.status === 'fully_addressed') {
    scoreLevel = 'pass';
    numericScore = 1.0;
  } else if (matchedRequirement.status === 'partially_addressed') {
    scoreLevel = 'partial';
    numericScore = 0.5;
  } else if (matchedRequirement.status === 'not_applicable') {
    scoreLevel = 'not_applicable';
    numericScore = 0;
  } else {
    scoreLevel = 'fail';
    numericScore = 0;
  }

  return {
    scoreLevel,
    numericScore,
    justification: matchedRequirement.supplierResponse || matchedRequirement.notes || undefined,
  };
}

/**
 * Calculates aggregated scores for all suppliers
 */
function calculateSupplierSummaries(
  requirements: ScoringMatrixRequirement[],
  cells: ScoringMatrixCell[],
  config: ScoringConfig
): ScoringMatrixSupplierSummary[] {
  const supplierIds = [...new Set(cells.map(c => c.supplierId))];
  const summaries: ScoringMatrixSupplierSummary[] = [];

  for (const supplierId of supplierIds) {
    const supplierCells = cells.filter(c => c.supplierId === supplierId);
    
    // Overall unweighted score
    const totalScore = supplierCells.reduce((sum, cell) => sum + cell.numericScore, 0);
    const overallScore = supplierCells.length > 0 ? (totalScore / supplierCells.length) * 100 : 0;

    // Weighted score
    let weightedSum = 0;
    let weightTotal = 0;
    for (const cell of supplierCells) {
      const req = requirements.find(r => r.requirementId === cell.requirementId);
      if (req) {
        const categoryWeight = config.defaultWeights[req.category] || 1.0;
        const reqWeight = req.defaultWeight * categoryWeight;
        weightedSum += cell.numericScore * reqWeight;
        weightTotal += reqWeight;
      }
    }
    const weightedScore = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0;

    // Category breakdown
    const categories: RequirementCategoryId[] = ['functional', 'commercial', 'legal', 'security', 'operational', 'other'];
    const categoryScores = categories.map(category => {
      const catRequirements = requirements.filter(r => r.category === category);
      const catCells = supplierCells.filter(c => catRequirements.some(r => r.requirementId === c.requirementId));
      
      const catTotal = catCells.reduce((sum, cell) => sum + cell.numericScore, 0);
      const score = catCells.length > 0 ? (catTotal / catCells.length) * 100 : 0;

      let catWeightedSum = 0;
      let catWeightTotal = 0;
      for (const cell of catCells) {
        const req = catRequirements.find(r => r.requirementId === cell.requirementId);
        if (req) {
          catWeightedSum += cell.numericScore * req.defaultWeight;
          catWeightTotal += req.defaultWeight;
        }
      }
      const weightedScore = catWeightTotal > 0 ? (catWeightedSum / catWeightTotal) * 100 : 0;

      return { category, score, weightedScore };
    });

    // Must-have compliance
    const mustHaveReqs = requirements.filter(r => r.importance === 'must_have');
    const mustHaveCells = supplierCells.filter(c => 
      mustHaveReqs.some(r => r.requirementId === c.requirementId)
    );
    const mustHavePassed = mustHaveCells.filter(c => c.scoreLevel === 'pass').length;
    const mustHaveFailed = mustHaveCells.filter(c => c.scoreLevel === 'fail').length;

    summaries.push({
      supplierId,
      supplierName: `Supplier ${supplierId.substring(0, 8)}`, // Will be resolved in API
      overallScore: Math.round(overallScore * 10) / 10,
      weightedScore: Math.round(weightedScore * 10) / 10,
      categoryScores,
      mustHaveCompliance: {
        total: mustHaveReqs.length,
        passed: mustHavePassed,
        failed: mustHaveFailed,
      },
    });
  }

  return summaries;
}

/**
 * Applies filters to requirements list
 */
function applyFilters(
  requirements: ScoringMatrixRequirement[],
  cells: ScoringMatrixCell[],
  filters: MatrixFilters
): ScoringMatrixRequirement[] {
  let filtered = [...requirements];

  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(r => r.category === filters.category);
  }

  // Only differentiators (where suppliers have different scores)
  if (filters.onlyDifferentiators) {
    filtered = filtered.filter(req => {
      const reqCells = cells.filter(c => c.requirementId === req.requirementId);
      const uniqueScores = new Set(reqCells.map(c => c.scoreLevel));
      return uniqueScores.size > 1;
    });
  }

  // Only failed or partial
  if (filters.onlyFailedOrPartial) {
    filtered = filtered.filter(req => {
      const reqCells = cells.filter(c => c.requirementId === req.requirementId);
      return reqCells.some(c => c.scoreLevel === 'fail' || c.scoreLevel === 'partial');
    });
  }

  // Search term
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(r =>
      r.shortLabel.toLowerCase().includes(term) ||
      r.longDescription.toLowerCase().includes(term) ||
      r.referenceKey.toLowerCase().includes(term)
    );
  }

  return filtered;
}

// ===========================
// MAPPING HELPERS
// ===========================

function mapSectionToCategory(sectionCode: string): RequirementCategoryId {
  const lower = sectionCode.toLowerCase();
  if (lower.includes('func') || lower.includes('tech')) return 'functional';
  if (lower.includes('comm') || lower.includes('price') || lower.includes('cost')) return 'commercial';
  if (lower.includes('legal') || lower.includes('contract')) return 'legal';
  if (lower.includes('sec') || lower.includes('compliance')) return 'security';
  if (lower.includes('oper') || lower.includes('service')) return 'operational';
  return 'other';
}

function mapClauseTypeToCategory(clauseType: string): RequirementCategoryId {
  const upper = clauseType.toUpperCase();
  if (upper.includes('LEGAL')) return 'legal';
  if (upper.includes('SECURITY') || upper.includes('COMPLIANCE')) return 'security';
  if (upper.includes('COMMERCIAL') || upper.includes('PRICING')) return 'commercial';
  if (upper.includes('OPERATIONAL')) return 'operational';
  return 'other';
}

function mapWeightToImportance(weight: number): RequirementImportance {
  if (weight >= 0.9) return 'must_have';
  if (weight >= 0.6) return 'should_have';
  return 'nice_to_have';
}

function mapMandatoryToImportance(isMandatory: boolean): RequirementImportance {
  return isMandatory ? 'must_have' : 'should_have';
}
