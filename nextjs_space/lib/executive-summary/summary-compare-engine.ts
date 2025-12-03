/**
 * STEP 46: AI-Powered Executive Summary Comparison (Semantic Diff Engine)
 * 
 * This module provides semantic comparison of Executive Summary versions using AI.
 * It detects meaningful changes, strengthened/weakened arguments, risk shifts,
 * and provides a narrative analysis of differences.
 */

import OpenAI from 'openai';
import type { ExecutiveSummaryDocument } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DimensionScore {
  score: number;
  rationale: string;
}

export interface ComparisonMetadata {
  summaryA: {
    version: number;
    tone: string;
    audience: string;
    updatedAt: Date;
  };
  summaryB: {
    version: number;
    tone: string;
    audience: string;
    updatedAt: Date;
  };
}

export interface StructuralDiff {
  sectionsAdded: string[];
  sectionsRemoved: string[];
  sectionsModified: string[];
}

export interface SemanticDiff {
  strengtheningChanges: string[];
  weakeningChanges: string[];
  riskShifts: string[];
  recommendationShifts: string[];
  omissionsDetected: string[];
  newInsightsAdded: string[];
}

export interface ComparisonScoring {
  overallChangeScore: number;      // 0-100
  narrativeShiftScore: number;     // 0-100
  riskShiftScore: number;          // 0-100
  recommendationShiftScore: number; // 0-100
}

export interface ComparisonResult {
  metadata: ComparisonMetadata;
  structuralDiff: StructuralDiff;
  semanticDiff: SemanticDiff;
  AIComparisonNarrative: string;
  scoring: ComparisonScoring;
}

// ============================================================================
// OPENAI CLIENT INITIALIZATION
// ============================================================================

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================================================
// MAIN COMPARISON FUNCTION
// ============================================================================

/**
 * Compares two Executive Summary versions and generates a detailed semantic diff
 * @param summaryA - First executive summary (typically the older version)
 * @param summaryB - Second executive summary (typically the newer version)
 * @returns Promise<ComparisonResult> - Comprehensive comparison analysis
 */
export async function compareExecutiveSummaries(
  summaryA: ExecutiveSummaryDocument,
  summaryB: ExecutiveSummaryDocument
): Promise<ComparisonResult> {
  
  // Extract metadata
  const metadata: ComparisonMetadata = {
    summaryA: {
      version: summaryA.version,
      tone: summaryA.tone,
      audience: summaryA.audience,
      updatedAt: summaryA.updatedAt,
    },
    summaryB: {
      version: summaryB.version,
      tone: summaryB.tone,
      audience: summaryB.audience,
      updatedAt: summaryB.updatedAt,
    },
  };

  // Check for edge cases
  if (!summaryA.content || !summaryB.content) {
    return buildEmptyDataFallback(metadata);
  }

  // Check if content is nearly identical
  if (areContentsIdentical(summaryA.content, summaryB.content)) {
    return buildMinimalChangesFallback(metadata);
  }

  // Attempt AI-powered comparison
  if (openai) {
    try {
      const aiResult = await generateAIComparison(summaryA, summaryB);
      return {
        metadata,
        ...aiResult,
      };
    } catch (error) {
      console.error('AI comparison failed, using fallback:', error);
      return buildRuleBasedFallback(summaryA, summaryB, metadata);
    }
  } else {
    // No OpenAI key, use rule-based fallback
    return buildRuleBasedFallback(summaryA, summaryB, metadata);
  }
}

// ============================================================================
// AI-POWERED COMPARISON
// ============================================================================

async function generateAIComparison(
  summaryA: ExecutiveSummaryDocument,
  summaryB: ExecutiveSummaryDocument
): Promise<Omit<ComparisonResult, 'metadata'>> {
  
  const prompt = `You are analyzing two versions of an Executive Summary for an RFP to identify semantic differences.

**Version A (v${summaryA.version}, ${summaryA.tone} tone for ${summaryA.audience} audience):**
${summaryA.content}

**Version B (v${summaryB.version}, ${summaryB.tone} tone for ${summaryB.audience} audience):**
${summaryB.content}

Analyze the semantic differences between these versions. Focus on:
1. **Content additions and removals**: What new content appears in Version B? What was removed?
2. **Strengthened or weakened arguments**: Are any claims more/less forceful?
3. **Risk assessment changes**: Are risks emphasized differently or new risks mentioned?
4. **Recommendation shifts**: Have recommendations changed or been rephrased?
5. **Tone changes**: Is the tone more/less confident, urgent, or formal?
6. **New insights vs. omissions**: What valuable information was added or lost?

Return a JSON object with this EXACT structure (ensure all fields are present):

{
  "structuralDiff": {
    "sectionsAdded": ["array of section titles added"],
    "sectionsRemoved": ["array of section titles removed"],
    "sectionsModified": ["array of section titles that changed"]
  },
  "semanticDiff": {
    "strengtheningChanges": ["array of arguments that became stronger"],
    "weakeningChanges": ["array of arguments that became weaker"],
    "riskShifts": ["array of risk-related changes"],
    "recommendationShifts": ["array of changed recommendations"],
    "omissionsDetected": ["array of important content removed"],
    "newInsightsAdded": ["array of valuable new insights"]
  },
  "AIComparisonNarrative": "3-6 paragraph narrative explaining the key differences, their strategic implications, and whether the changes strengthen or weaken the overall summary. Focus on meaningful changes, not trivial wording differences.",
  "scoring": {
    "overallChangeScore": 0-100,
    "narrativeShiftScore": 0-100,
    "riskShiftScore": 0-100,
    "recommendationShiftScore": 0-100
  }
}

**Important**: 
- If content is nearly identical, set all scores to 0-10 and note "Minimal Changes Detected"
- Do not hallucinate content that isn't present
- Focus on MEANINGFUL semantic differences, not just wording variations
- Each array should contain 0-10 items, prioritize the most significant changes`;

  // Try GPT-4o-mini first
  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return validateAndNormalizeAIResult(result);
    
  } catch (error) {
    console.warn('GPT-4o-mini failed, trying GPT-4o...', error);
    
    // Fallback to GPT-4o
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return validateAndNormalizeAIResult(result);
  }
}

// ============================================================================
// RESULT VALIDATION & NORMALIZATION
// ============================================================================

function validateAndNormalizeAIResult(result: any): Omit<ComparisonResult, 'metadata'> {
  return {
    structuralDiff: {
      sectionsAdded: Array.isArray(result.structuralDiff?.sectionsAdded) 
        ? result.structuralDiff.sectionsAdded 
        : [],
      sectionsRemoved: Array.isArray(result.structuralDiff?.sectionsRemoved) 
        ? result.structuralDiff.sectionsRemoved 
        : [],
      sectionsModified: Array.isArray(result.structuralDiff?.sectionsModified) 
        ? result.structuralDiff.sectionsModified 
        : [],
    },
    semanticDiff: {
      strengtheningChanges: Array.isArray(result.semanticDiff?.strengtheningChanges) 
        ? result.semanticDiff.strengtheningChanges 
        : [],
      weakeningChanges: Array.isArray(result.semanticDiff?.weakeningChanges) 
        ? result.semanticDiff.weakeningChanges 
        : [],
      riskShifts: Array.isArray(result.semanticDiff?.riskShifts) 
        ? result.semanticDiff.riskShifts 
        : [],
      recommendationShifts: Array.isArray(result.semanticDiff?.recommendationShifts) 
        ? result.semanticDiff.recommendationShifts 
        : [],
      omissionsDetected: Array.isArray(result.semanticDiff?.omissionsDetected) 
        ? result.semanticDiff.omissionsDetected 
        : [],
      newInsightsAdded: Array.isArray(result.semanticDiff?.newInsightsAdded) 
        ? result.semanticDiff.newInsightsAdded 
        : [],
    },
    AIComparisonNarrative: result.AIComparisonNarrative || 'No narrative provided by AI.',
    scoring: {
      overallChangeScore: clampScore(result.scoring?.overallChangeScore),
      narrativeShiftScore: clampScore(result.scoring?.narrativeShiftScore),
      riskShiftScore: clampScore(result.scoring?.riskShiftScore),
      recommendationShiftScore: clampScore(result.scoring?.recommendationShiftScore),
    },
  };
}

function clampScore(score: any): number {
  const num = typeof score === 'number' ? score : 50;
  return Math.max(0, Math.min(100, num));
}

// ============================================================================
// EDGE CASE HANDLERS
// ============================================================================

function areContentsIdentical(contentA: string, contentB: string): boolean {
  // Normalize whitespace and compare
  const normalizedA = contentA.replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizedB = contentB.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Calculate similarity (simple character-level)
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  if (maxLen === 0) return true;
  
  let matchCount = 0;
  for (let i = 0; i < Math.min(normalizedA.length, normalizedB.length); i++) {
    if (normalizedA[i] === normalizedB[i]) matchCount++;
  }
  
  const similarity = matchCount / maxLen;
  return similarity > 0.95; // 95% similarity threshold
}

function buildEmptyDataFallback(metadata: ComparisonMetadata): ComparisonResult {
  return {
    metadata,
    structuralDiff: {
      sectionsAdded: [],
      sectionsRemoved: [],
      sectionsModified: [],
    },
    semanticDiff: {
      strengtheningChanges: [],
      weakeningChanges: [],
      riskShifts: [],
      recommendationShifts: [],
      omissionsDetected: [],
      newInsightsAdded: [],
    },
    AIComparisonNarrative: 'Not Enough Data to Compare: One or both summaries have empty content.',
    scoring: {
      overallChangeScore: 0,
      narrativeShiftScore: 0,
      riskShiftScore: 0,
      recommendationShiftScore: 0,
    },
  };
}

function buildMinimalChangesFallback(metadata: ComparisonMetadata): ComparisonResult {
  return {
    metadata,
    structuralDiff: {
      sectionsAdded: [],
      sectionsRemoved: [],
      sectionsModified: [],
    },
    semanticDiff: {
      strengtheningChanges: [],
      weakeningChanges: [],
      riskShifts: [],
      recommendationShifts: [],
      omissionsDetected: [],
      newInsightsAdded: [],
    },
    AIComparisonNarrative: 'Minimal Changes Detected: The two summary versions are nearly identical with no significant semantic differences.',
    scoring: {
      overallChangeScore: 5,
      narrativeShiftScore: 5,
      riskShiftScore: 0,
      recommendationShiftScore: 0,
    },
  };
}

function buildRuleBasedFallback(
  summaryA: ExecutiveSummaryDocument,
  summaryB: ExecutiveSummaryDocument,
  metadata: ComparisonMetadata
): ComparisonResult {
  // Simple rule-based analysis as fallback
  const contentA = summaryA.content.toLowerCase();
  const contentB = summaryB.content.toLowerCase();
  
  const lengthDiff = Math.abs(summaryB.content.length - summaryA.content.length);
  const lengthChangePercent = (lengthDiff / summaryA.content.length) * 100;
  
  const riskKeywords = ['risk', 'concern', 'issue', 'challenge', 'problem'];
  const riskCountA = riskKeywords.reduce((acc, kw) => 
    acc + (contentA.match(new RegExp(kw, 'g')) || []).length, 0);
  const riskCountB = riskKeywords.reduce((acc, kw) => 
    acc + (contentB.match(new RegExp(kw, 'g')) || []).length, 0);
  
  return {
    metadata,
    structuralDiff: {
      sectionsAdded: [],
      sectionsRemoved: [],
      sectionsModified: lengthChangePercent > 10 ? ['Content structure modified'] : [],
    },
    semanticDiff: {
      strengtheningChanges: [],
      weakeningChanges: [],
      riskShifts: riskCountB > riskCountA 
        ? ['Increased emphasis on risks or concerns'] 
        : riskCountB < riskCountA 
        ? ['Decreased emphasis on risks or concerns'] 
        : [],
      recommendationShifts: [],
      omissionsDetected: [],
      newInsightsAdded: [],
    },
    AIComparisonNarrative: `Rule-based comparison (AI unavailable): Version B is ${lengthChangePercent.toFixed(1)}% ${lengthDiff > 0 ? 'longer' : 'shorter'} than Version A. ${riskCountB > riskCountA ? 'Risk-related language increased.' : riskCountB < riskCountA ? 'Risk-related language decreased.' : 'Risk emphasis unchanged.'} Tone shifted from ${metadata.summaryA.tone} to ${metadata.summaryB.tone}.`,
    scoring: {
      overallChangeScore: Math.min(100, Math.round(lengthChangePercent * 2)),
      narrativeShiftScore: Math.min(100, Math.round(lengthChangePercent)),
      riskShiftScore: Math.abs(riskCountB - riskCountA) * 10,
      recommendationShiftScore: 30, // Default moderate score
    },
  };
}
