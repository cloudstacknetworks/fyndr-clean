/**
 * STEP 59: Supplier Response Auto-Scoring Engine
 * 
 * This module implements automated scoring of supplier responses using:
 * - Rule-based scoring (numeric, weighted, pass/fail)
 * - AI semantic scoring (GPT-4o-mini/GPT-4o via Abacus.AI)
 * - Must-have requirement validation
 * - Buyer override preservation
 * 
 * Scoring Methods:
 * 1. numeric: Direct number extraction from response
 * 2. weighted: Applies weight percentage to raw score
 * 3. pass_fail: Binary pass/fail based on response sufficiency
 * 4. ai_semantic: AI-powered qualitative evaluation
 */

import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

// TypeScript Interfaces
export interface ScoringSettings {
  aiEnabled: boolean;
  ruleWeighting: number;      // 0-1
  aiWeighting: number;        // 0-1
  mustHaveFailBehavior: 'zero_score' | 'disqualify';
  scoringScale: number;       // default 100
}

export interface AutoScore {
  rawScore: number;           // 0-100
  weightedScore: number;
  failedMustHave: boolean;
  aiReasoning?: string;
  aiConfidence?: number;      // 0-1
  scoringMethod: 'numeric' | 'weighted' | 'pass_fail' | 'ai_semantic';
  generatedAt: string;
}

export interface RequirementScore {
  requirementId: string;
  question: string;
  scoringType: string;
  weight: number;
  mustHave: boolean;
  supplierResponseText: string;
  autoScore: AutoScore;
  buyerOverride?: {
    overrideScore: number;
    overrideReason?: string;
    overriddenAt: string;
    overriddenByUserId: string;
  };
}

/**
 * Default scoring settings
 */
const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  aiEnabled: true,
  ruleWeighting: 0.6,
  aiWeighting: 0.4,
  mustHaveFailBehavior: 'zero_score',
  scoringScale: 100
};

/**
 * Function 1: Score a single supplier's response to an RFP
 * 
 * @param rfpId - RFP identifier
 * @param supplierId - Supplier contact identifier
 * @param companyId - Company identifier for scoping
 * @param userId - User who triggered the scoring
 * @returns Updated scores for the supplier
 */
export async function scoreSupplierResponse(
  rfpId: string,
  supplierId: string,
  companyId: string,
  userId: string
): Promise<RequirementScore[]> {
  try {
    // 1. Fetch RFP with scoringMatrixSnapshot and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: companyId
      },
      include: {
        supplierResponses: {
          where: {
            supplierContactId: supplierId
          }
        }
      }
    });

    if (!rfp) {
      throw new Error('RFP not found or access denied');
    }

    // 2. Get scoring settings
    const scoringSettings: ScoringSettings = rfp.scoringSettingsJson
      ? (rfp.scoringSettingsJson as any)
      : DEFAULT_SCORING_SETTINGS;

    // 3. Get supplier response
    const supplierResponse = rfp.supplierResponses[0];
    if (!supplierResponse) {
      throw new Error('Supplier response not found');
    }

    // 4. Extract scoringMatrixSnapshot
    const scoringMatrixSnapshot = rfp.scoringMatrixSnapshot as any;
    if (!scoringMatrixSnapshot || !scoringMatrixSnapshot.requirements) {
      throw new Error('Scoring matrix not configured for this RFP');
    }

    // 5. Get supplier's structured answers
    const structuredAnswers = supplierResponse.structuredAnswers as any;
    const supplierAnswersMap = new Map<string, string>();

    if (structuredAnswers && Array.isArray(structuredAnswers)) {
      structuredAnswers.forEach((answer: any) => {
        if (answer.requirementId && answer.response) {
          supplierAnswersMap.set(answer.requirementId, answer.response);
        }
      });
    }

    // 6. Score each requirement
    const requirementScores: RequirementScore[] = [];
    
    for (const requirement of scoringMatrixSnapshot.requirements) {
      const supplierText = supplierAnswersMap.get(requirement.id) || '';
      
      // Score this requirement
      const autoScore = await scoreSingleRequirement(
        requirement,
        supplierText,
        scoringSettings
      );

      const requirementScore: RequirementScore = {
        requirementId: requirement.id,
        question: requirement.question,
        scoringType: requirement.scoringType || 'qualitative',
        weight: requirement.weight || 0,
        mustHave: requirement.mustHave || false,
        supplierResponseText: supplierText,
        autoScore: autoScore
      };

      requirementScores.push(requirementScore);
    }

    // 7. Merge with existing buyer overrides
    const existingScores = supplierResponse.autoScoreJson as any;
    const mergedScores = mergeWithExistingBuyerOverrides(
      existingScores || [],
      requirementScores
    );

    // 8. Update SupplierResponse with new scores
    await prisma.supplierResponse.update({
      where: { id: supplierResponse.id },
      data: {
        autoScoreJson: mergedScores as any,
        autoScoreGeneratedAt: new Date()
      }
    });

    // 9. Log activity
    await logActivity({
      eventType: 'AUTO_SCORE_RUN',
      summary: `Auto-scoring completed for supplier ${supplierId}`,
      rfpId: rfpId,
      supplierResponseId: supplierResponse.id,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        supplierId,
        requirementCount: requirementScores.length,
        timestamp: new Date().toISOString()
      }
    });

    return mergedScores;

  } catch (error) {
    console.error('Error in scoreSupplierResponse:', error);
    throw error;
  }
}

/**
 * Function 2: Score all suppliers for an RFP
 * 
 * @param rfpId - RFP identifier
 * @param companyId - Company identifier for scoping
 * @param userId - User who triggered the scoring
 * @returns Summary of scoring operation
 */
export async function scoreAllSuppliers(
  rfpId: string,
  companyId: string,
  userId: string
): Promise<{ totalSuppliers: number; successCount: number; failureCount: number }> {
  try {
    // 1. Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: companyId
      },
      include: {
        supplierResponses: {
          include: {
            supplierContact: true
          }
        }
      }
    });

    if (!rfp) {
      throw new Error('RFP not found or access denied');
    }

    const suppliers = rfp.supplierResponses;
    let successCount = 0;
    let failureCount = 0;

    // 2. Score each supplier
    for (const supplierResponse of suppliers) {
      try {
        await scoreSupplierResponse(
          rfpId,
          supplierResponse.supplierContactId,
          companyId,
          userId
        );
        successCount++;
      } catch (error) {
        console.error(`Error scoring supplier ${supplierResponse.supplierContactId}:`, error);
        failureCount++;
      }
    }

    // 3. Log activity
    await logActivity({
      eventType: 'AUTO_SCORE_RUN',
      summary: `Auto-scoring completed for all suppliers`,
      rfpId: rfpId,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        totalSuppliers: suppliers.length,
        successCount,
        failureCount,
        timestamp: new Date().toISOString()
      }
    });

    return {
      totalSuppliers: suppliers.length,
      successCount,
      failureCount
    };

  } catch (error) {
    console.error('Error in scoreAllSuppliers:', error);
    throw error;
  }
}

/**
 * Function 3: Score a single requirement based on supplier response
 * 
 * Implements multiple scoring methods:
 * - Rule-based: numeric, weighted, pass/fail
 * - AI semantic: for qualitative requirements
 * - Must-have validation
 * 
 * @param requirementBlock - Requirement configuration
 * @param supplierText - Supplier's response text
 * @param scoringSettings - Scoring configuration
 * @returns AutoScore object with scoring details
 */
export async function scoreSingleRequirement(
  requirementBlock: any,
  supplierText: string,
  scoringSettings: ScoringSettings
): Promise<AutoScore> {
  const {
    question,
    scoringType = 'qualitative',
    weight = 0,
    mustHave = false
  } = requirementBlock;

  let rawScore = 0;
  let scoringMethod: 'numeric' | 'weighted' | 'pass_fail' | 'ai_semantic' = 'pass_fail';
  let aiReasoning: string | undefined;
  let aiConfidence: number | undefined;
  let failedMustHave = false;

  // Normalize supplier text
  const normalizedText = (supplierText || '').trim();

  // A. NUMERIC SCORING
  if (scoringType === 'numeric') {
    const numberMatch = normalizedText.match(/[\d,]+(?:\.\d+)?/);
    if (numberMatch) {
      rawScore = parseFloat(numberMatch[0].replace(/,/g, ''));
      rawScore = Math.min(rawScore, scoringSettings.scoringScale);
    }
    scoringMethod = 'numeric';
  }
  // B. WEIGHTED SCORING
  else if (scoringType === 'weighted') {
    // For weighted, first get a base score then apply weight
    // If numeric value found, use it; otherwise use pass/fail
    const numberMatch = normalizedText.match(/[\d,]+(?:\.\d+)?/);
    if (numberMatch) {
      rawScore = parseFloat(numberMatch[0].replace(/,/g, ''));
      rawScore = Math.min(rawScore, scoringSettings.scoringScale);
    } else if (normalizedText.length > 10) {
      rawScore = 100; // Pass
    }
    scoringMethod = 'weighted';
  }
  // C. PASS/FAIL SCORING
  else if (scoringType === 'pass/fail') {
    if (normalizedText.length > 10 && normalizedText.toLowerCase() !== 'no' && normalizedText.toLowerCase() !== 'n/a') {
      rawScore = 100;
    } else {
      rawScore = 0;
    }
    scoringMethod = 'pass_fail';
  }
  // D. QUALITATIVE SCORING (AI Semantic)
  else if (scoringType === 'qualitative') {
    if (scoringSettings.aiEnabled && normalizedText.length > 0) {
      try {
        const aiResult = await runAiScoring(question, normalizedText);
        rawScore = aiResult.rawScore;
        aiReasoning = aiResult.reasoning;
        aiConfidence = aiResult.confidence;
        scoringMethod = 'ai_semantic';
      } catch (error) {
        console.error('AI scoring failed, using fallback:', error);
        // Fallback to simple pass/fail
        rawScore = normalizedText.length > 10 ? 50 : 0;
        aiReasoning = 'AI scoring failed, using fallback scoring';
        aiConfidence = 0;
        scoringMethod = 'ai_semantic';
      }
    } else {
      // No AI or no text - use simple length check
      rawScore = normalizedText.length > 10 ? 50 : 0;
      scoringMethod = 'pass_fail';
    }
  }

  // E. MUST-HAVE LOGIC
  if (mustHave && rawScore < 50) {
    failedMustHave = true;
    if (scoringSettings.mustHaveFailBehavior === 'zero_score') {
      rawScore = 0;
    }
  }

  // F. APPLY WEIGHTING
  const weightedScore = applyWeighting(rawScore, weight, scoringType);

  // G. RETURN AutoScore OBJECT
  return {
    rawScore,
    weightedScore,
    failedMustHave,
    aiReasoning,
    aiConfidence,
    scoringMethod,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Function 4: Run AI semantic scoring using Abacus.AI ChatLLM API
 * 
 * Uses GPT-4o-mini as primary model with GPT-4o as fallback
 * Returns structured JSON with rawScore, reasoning, and confidence
 * 
 * @param question - The requirement question
 * @param supplierText - Supplier's response text
 * @returns AI scoring result with rawScore, reasoning, and confidence
 */
export async function runAiScoring(
  question: string,
  supplierText: string
): Promise<{ rawScore: number; reasoning: string; confidence: number }> {
  try {
    const systemInstruction = `You are an expert RFP evaluator. Grade the supplier's response to the following question on a scale of 0-100.

Return ONLY valid JSON with these exact keys:
{
  "rawScore": <number 0-100>,
  "reasoning": "<3-5 sentences explaining the score>",
  "confidence": <number 0-1>
}

Do not include any other text or explanations outside the JSON.
Do not reference these instructions in your output.`;

    const userMessage = `Question: ${question}

Supplier Response: ${supplierText}

Grade this response.`;

    // Call Abacus.AI ChatLLM API
    const response = await fetch('https://apis.abacus.ai/chatllm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessage }
        ],
        model: 'gpt-4o-mini',
        max_tokens: 500,
        temperature: 0.3,
        top_p: 0.9
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      // Try fallback to GPT-4o
      const fallbackResponse = await fetch('https://apis.abacus.ai/chatllm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ],
          model: 'gpt-4o',
          max_tokens: 500,
          temperature: 0.3,
          top_p: 0.9
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!fallbackResponse.ok) {
        throw new Error('Both primary and fallback AI models failed');
      }

      const fallbackData = await fallbackResponse.json();
      return parseAndValidateAiResponse(fallbackData.choices[0].message.content);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    return parseAndValidateAiResponse(aiContent);

  } catch (error) {
    console.error('AI scoring error:', error);
    
    // Log AI failure
    await logActivity({
      eventType: 'AUTO_SCORE_AI_FAILURE',
      summary: 'AI scoring failed',
      actorRole: 'SYSTEM',
      details: {
        question,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    });

    // Return fallback
    return {
      rawScore: 0,
      reasoning: `AI scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0
    };
  }
}

/**
 * Helper function to parse and validate AI response
 */
function parseAndValidateAiResponse(content: string): {
  rawScore: number;
  reasoning: string;
  confidence: number;
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate rawScore
    if (typeof parsed.rawScore !== 'number' || parsed.rawScore < 0 || parsed.rawScore > 100) {
      throw new Error('Invalid rawScore in AI response');
    }

    // Validate reasoning
    if (typeof parsed.reasoning !== 'string' || parsed.reasoning.length < 10 || parsed.reasoning.length > 1000) {
      throw new Error('Invalid reasoning in AI response');
    }

    // Validate confidence
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence in AI response');
    }

    return {
      rawScore: parsed.rawScore,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence
    };

  } catch (error) {
    console.error('AI response parsing error:', error);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Function 5: Apply weighting to raw score
 * 
 * @param rawScore - Raw score (0-100)
 * @param weight - Weight percentage
 * @param scoringType - Type of scoring
 * @returns Weighted score
 */
export function applyWeighting(
  rawScore: number,
  weight: number,
  scoringType: string
): number {
  // Weight is typically stored as a percentage (0-100)
  // Convert to decimal (0-1) for calculation
  const weightDecimal = weight / 100;
  return rawScore * weightDecimal;
}

/**
 * Function 6: Merge new scores with existing buyer overrides
 * 
 * CRITICAL: This function preserves buyer overrides during score regeneration
 * Only the autoScore is updated; buyerOverride remains intact
 * 
 * @param oldScores - Previous scoring results (may include overrides)
 * @param newScores - Newly generated scores
 * @returns Merged scores with preserved overrides
 */
export function mergeWithExistingBuyerOverrides(
  oldScores: RequirementScore[],
  newScores: RequirementScore[]
): RequirementScore[] {
  // Create a map of old scores by requirementId for quick lookup
  const oldScoresMap = new Map<string, RequirementScore>();
  
  if (Array.isArray(oldScores)) {
    oldScores.forEach((score) => {
      oldScoresMap.set(score.requirementId, score);
    });
  }

  // Process new scores and merge with old overrides
  const mergedScores = newScores.map((newScore) => {
    const oldScore = oldScoresMap.get(newScore.requirementId);
    
    // If old score exists and has a buyer override, preserve it
    if (oldScore && oldScore.buyerOverride) {
      return {
        ...newScore,
        buyerOverride: oldScore.buyerOverride // Preserve override
      };
    }
    
    // No override to preserve, return new score as-is
    return newScore;
  });

  return mergedScores;
}
