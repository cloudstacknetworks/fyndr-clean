/**
 * STEP 61: Buyer Evaluation Workspace - Evaluation Engine
 * 
 * This module provides the core functionality for the buyer evaluation workspace:
 * - Loading evaluation workspace data
 * - Applying and clearing score overrides
 * - Managing evaluator comments
 * - Calculating score variance
 * 
 * All operations are scoped by company and enforce buyer-only access.
 */

import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { RequirementScore } from '@/lib/scoring/auto-scoring-engine';

// TypeScript Interfaces
export interface EvaluationWorkspaceData {
  rfp: {
    id: string;
    title: string;
    scoringMatrixSnapshot: any;
  };
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  supplierResponse: {
    id: string;
    scoredResponses: any;
    overrides: any;
    comments: any[];
  };
  scoringItems: ScoringItem[];
  summary: EvaluationSummary;
}

export interface ScoringItem {
  requirementId: string;
  requirementTitle: string;
  requirementText: string;
  supplierResponseText: string;
  autoScore: number;
  overrideScore: number | null;
  overrideJustification: string | null;
  overrideTimestamp: string | null;
  overrideUserId: string | null;
  overrideUserName: string | null;
  variance: number;
  varianceLevel: 'low' | 'medium' | 'high';
  mustHave: boolean;
  mustHaveViolation: boolean;
  scoringType: string;
  weight: number;
  comments: CommentItem[];
}

export interface CommentItem {
  id: string;
  commentText: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface EvaluationSummary {
  totalAutoScore: number;
  totalOverrideScore: number;
  totalWeightedAutoScore: number;
  totalWeightedOverrideScore: number;
  overrideCount: number;
  commentCount: number;
  mustHaveFailures: number;
  missingResponses: number;
  averageVariance: number;
}

export interface OverrideRecord {
  score: number;
  justification: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface CommentRecord {
  id: string;
  requirementId: string;
  commentText: string;
  userId: string;
  userName: string;
  timestamp: string;
}

/**
 * Function 1: Get evaluation workspace data for a supplier
 * 
 * @param rfpId - RFP identifier
 * @param supplierId - Supplier contact identifier
 * @param userId - User requesting the data
 * @returns Complete workspace data
 */
export async function getEvaluationWorkspaceData(
  rfpId: string,
  supplierId: string,
  userId: string
): Promise<EvaluationWorkspaceData> {
  try {
    // 1. Fetch user to get companyId and verify buyer role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const error = new Error('User not found');
      (error as any).status = 404;
      throw error;
    }

    if (user.role === 'supplier') {
      const error = new Error('Forbidden: Suppliers cannot access evaluation workspace');
      (error as any).status = 403;
      throw error;
    }

    // 2. Fetch RFP with scoringMatrixSnapshot and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: user.companyId
      }
    });

    if (!rfp) {
      const error = new Error('RFP not found or access denied');
      (error as any).status = 404;
      throw error;
    }

    // 3. Fetch SupplierContact details
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        id: supplierId,
        rfpId: rfpId
      }
    });

    if (!supplierContact) {
      const error = new Error('Supplier not found');
      (error as any).status = 404;
      throw error;
    }

    // 4. Fetch SupplierResponse
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      }
    });

    if (!supplierResponse) {
      const error = new Error('Supplier response not found');
      (error as any).status = 404;
      throw error;
    }

    // 5. Parse scoringMatrixSnapshot
    const scoringMatrixSnapshot = rfp.scoringMatrixSnapshot as any;
    if (!scoringMatrixSnapshot || !scoringMatrixSnapshot.requirements) {
      const error = new Error('Scoring matrix not configured for this RFP');
      (error as any).status = 400;
      throw error;
    }

    // 6. Parse auto-scores from autoScoreJson
    const autoScores = (supplierResponse.autoScoreJson as unknown as RequirementScore[]) || [];
    const autoScoresMap = new Map<string, RequirementScore>();
    autoScores.forEach((score) => {
      autoScoresMap.set(score.requirementId, score);
    });

    // 7. Parse overrides
    const overrides = (supplierResponse.overrides as unknown as Record<string, OverrideRecord>) || {};

    // 8. Parse comments
    const allComments = (supplierResponse.comments as unknown as CommentRecord[]) || [];

    // 9. Build scoring items
    const scoringItems: ScoringItem[] = [];
    let totalAutoScore = 0;
    let totalOverrideScore = 0;
    let totalWeightedAutoScore = 0;
    let totalWeightedOverrideScore = 0;
    let overrideCount = 0;
    let mustHaveFailures = 0;
    let missingResponses = 0;
    let totalVariance = 0;
    let varianceCount = 0;

    for (const requirement of scoringMatrixSnapshot.requirements) {
      const requirementId = requirement.id;
      const autoScoreData = autoScoresMap.get(requirementId);
      const override = overrides[requirementId];
      
      // Get auto score
      const autoScore = autoScoreData?.autoScore?.rawScore || 0;
      const supplierResponseText = autoScoreData?.supplierResponseText || '';
      
      // Get override score
      const overrideScore = override ? override.score : null;
      const overrideJustification = override ? override.justification : null;
      const overrideTimestamp = override ? override.timestamp : null;
      const overrideUserId = override ? override.userId : null;
      const overrideUserName = override ? override.userName : null;
      
      // Calculate variance
      const variance = overrideScore !== null ? Math.abs(autoScore - overrideScore) : 0;
      const varianceLevel: 'low' | 'medium' | 'high' = 
        variance <= 1 ? 'low' : 
        variance <= 3 ? 'medium' : 
        'high';
      
      // Check must-have violation
      const mustHave = requirement.mustHave || false;
      const effectiveScore = overrideScore !== null ? overrideScore : autoScore;
      const mustHaveViolation = mustHave && effectiveScore < 50;
      
      // Get comments for this requirement
      const requirementComments = allComments
        .filter(c => c.requirementId === requirementId)
        .map(c => ({
          id: c.id,
          commentText: c.commentText,
          userId: c.userId,
          userName: c.userName,
          timestamp: c.timestamp
        }));
      
      // Build scoring item
      const scoringItem: ScoringItem = {
        requirementId,
        requirementTitle: requirement.question || requirement.title || 'Untitled Requirement',
        requirementText: requirement.question || '',
        supplierResponseText,
        autoScore,
        overrideScore,
        overrideJustification,
        overrideTimestamp,
        overrideUserId,
        overrideUserName,
        variance,
        varianceLevel,
        mustHave,
        mustHaveViolation,
        scoringType: requirement.scoringType || 'qualitative',
        weight: requirement.weight || 0,
        comments: requirementComments
      };
      
      scoringItems.push(scoringItem);
      
      // Update summary statistics
      totalAutoScore += autoScore;
      totalOverrideScore += effectiveScore;
      totalWeightedAutoScore += autoScore * (requirement.weight || 0);
      totalWeightedOverrideScore += effectiveScore * (requirement.weight || 0);
      
      if (override) {
        overrideCount++;
        totalVariance += variance;
        varianceCount++;
      }
      
      if (mustHaveViolation) {
        mustHaveFailures++;
      }
      
      if (!supplierResponseText || supplierResponseText.trim() === '') {
        missingResponses++;
      }
    }

    // 10. Calculate summary
    const requirementCount = scoringMatrixSnapshot.requirements.length || 1;
    const averageVariance = varianceCount > 0 ? totalVariance / varianceCount : 0;
    
    const summary: EvaluationSummary = {
      totalAutoScore: totalAutoScore / requirementCount,
      totalOverrideScore: totalOverrideScore / requirementCount,
      totalWeightedAutoScore,
      totalWeightedOverrideScore,
      overrideCount,
      commentCount: allComments.length,
      mustHaveFailures,
      missingResponses,
      averageVariance
    };

    // 11. Return workspace data
    return {
      rfp: {
        id: rfp.id,
        title: rfp.title,
        scoringMatrixSnapshot: scoringMatrixSnapshot
      },
      supplier: {
        id: supplierContact.id,
        name: supplierContact.name,
        email: supplierContact.email
      },
      supplierResponse: {
        id: supplierResponse.id,
        scoredResponses: autoScores,
        overrides: overrides,
        comments: allComments
      },
      scoringItems,
      summary
    };

  } catch (error) {
    console.error('Error in getEvaluationWorkspaceData:', error);
    throw error;
  }
}

/**
 * Function 2: Apply score override
 * 
 * @param rfpId - RFP identifier
 * @param supplierId - Supplier contact identifier
 * @param requirementId - Requirement identifier
 * @param newScore - New override score (0-100)
 * @param justification - Justification for override (required)
 * @param userId - User applying the override
 * @returns Success response
 */
export async function applyOverrideScore(
  rfpId: string,
  supplierId: string,
  requirementId: string,
  newScore: number,
  justification: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Validate inputs
    if (newScore < 0 || newScore > 100) {
      const error = new Error('Score must be between 0 and 100');
      (error as any).status = 400;
      throw error;
    }

    if (!justification || justification.trim() === '') {
      const error = new Error('Justification is required');
      (error as any).status = 400;
      throw error;
    }

    // 2. Fetch user to get companyId and verify buyer role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const error = new Error('User not found');
      (error as any).status = 404;
      throw error;
    }

    if (user.role === 'supplier') {
      const error = new Error('Forbidden: Suppliers cannot override scores');
      (error as any).status = 403;
      throw error;
    }

    // 3. Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: user.companyId
      }
    });

    if (!rfp) {
      const error = new Error('RFP not found or access denied');
      (error as any).status = 404;
      throw error;
    }

    // 4. Fetch SupplierResponse
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      }
    });

    if (!supplierResponse) {
      const error = new Error('Supplier response not found');
      (error as any).status = 404;
      throw error;
    }

    // 5. Update overrides
    const overrides = (supplierResponse.overrides as unknown as Record<string, OverrideRecord>) || {};
    overrides[requirementId] = {
      score: newScore,
      justification: justification.trim(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name || user.email
    };

    // 6. Save to database
    await prisma.supplierResponse.update({
      where: { id: supplierResponse.id },
      data: { overrides: overrides as any }
    });

    // 7. Log activity
    await logActivity({
      eventType: 'SCORE_OVERRIDE_APPLIED',
      summary: `Score override applied for requirement ${requirementId}`,
      rfpId: rfpId,
      supplierResponseId: supplierResponse.id,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        supplierId,
        requirementId,
        newScore,
        justification,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: 'Override applied successfully'
    };

  } catch (error) {
    console.error('Error in applyOverrideScore:', error);
    throw error;
  }
}

/**
 * Function 3: Clear score override
 * 
 * @param rfpId - RFP identifier
 * @param supplierId - Supplier contact identifier
 * @param requirementId - Requirement identifier
 * @param userId - User clearing the override
 * @returns Success response
 */
export async function clearOverrideScore(
  rfpId: string,
  supplierId: string,
  requirementId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Fetch user to get companyId and verify buyer role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const error = new Error('User not found');
      (error as any).status = 404;
      throw error;
    }

    if (user.role === 'supplier') {
      const error = new Error('Forbidden: Suppliers cannot clear overrides');
      (error as any).status = 403;
      throw error;
    }

    // 2. Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: user.companyId
      }
    });

    if (!rfp) {
      const error = new Error('RFP not found or access denied');
      (error as any).status = 404;
      throw error;
    }

    // 3. Fetch SupplierResponse
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      }
    });

    if (!supplierResponse) {
      const error = new Error('Supplier response not found');
      (error as any).status = 404;
      throw error;
    }

    // 4. Remove override entry
    const overrides = (supplierResponse.overrides as unknown as Record<string, OverrideRecord>) || {};
    delete overrides[requirementId];

    // 5. Save to database
    await prisma.supplierResponse.update({
      where: { id: supplierResponse.id },
      data: { overrides: overrides as any }
    });

    // 6. Log activity
    await logActivity({
      eventType: 'SCORE_OVERRIDE_CLEARED',
      summary: `Score override cleared for requirement ${requirementId}`,
      rfpId: rfpId,
      supplierResponseId: supplierResponse.id,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        supplierId,
        requirementId,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: 'Override cleared successfully'
    };

  } catch (error) {
    console.error('Error in clearOverrideScore:', error);
    throw error;
  }
}

/**
 * Function 4: Save evaluator comment
 * 
 * @param rfpId - RFP identifier
 * @param supplierId - Supplier contact identifier
 * @param requirementId - Requirement identifier
 * @param commentText - Comment text
 * @param userId - User adding the comment
 * @returns Success response with new comment
 */
export async function saveEvaluatorComment(
  rfpId: string,
  supplierId: string,
  requirementId: string,
  commentText: string,
  userId: string
): Promise<{ success: boolean; message: string; comment: CommentRecord }> {
  try {
    // 1. Validate inputs
    if (!commentText || commentText.trim() === '') {
      const error = new Error('Comment text is required');
      (error as any).status = 400;
      throw error;
    }

    // 2. Fetch user to get companyId and verify buyer role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const error = new Error('User not found');
      (error as any).status = 404;
      throw error;
    }

    if (user.role === 'supplier') {
      const error = new Error('Forbidden: Suppliers cannot add evaluator comments');
      (error as any).status = 403;
      throw error;
    }

    // 3. Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: user.companyId
      }
    });

    if (!rfp) {
      const error = new Error('RFP not found or access denied');
      (error as any).status = 404;
      throw error;
    }

    // 4. Fetch SupplierResponse
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      }
    });

    if (!supplierResponse) {
      const error = new Error('Supplier response not found');
      (error as any).status = 404;
      throw error;
    }

    // 5. Create new comment
    const newComment: CommentRecord = {
      id: crypto.randomUUID(),
      requirementId,
      commentText: commentText.trim(),
      userId: user.id,
      userName: user.name || user.email,
      timestamp: new Date().toISOString()
    };

    // 6. Append to comments array
    const comments = (supplierResponse.comments as unknown as CommentRecord[]) || [];
    comments.push(newComment);

    // 7. Save to database
    await prisma.supplierResponse.update({
      where: { id: supplierResponse.id },
      data: { comments: comments as any }
    });

    // 8. Log activity
    await logActivity({
      eventType: 'EVALUATOR_COMMENT_ADDED',
      summary: `Evaluator comment added for requirement ${requirementId}`,
      rfpId: rfpId,
      supplierResponseId: supplierResponse.id,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        supplierId,
        requirementId,
        commentText: commentText.trim(),
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: 'Comment saved successfully',
      comment: newComment
    };

  } catch (error) {
    console.error('Error in saveEvaluatorComment:', error);
    throw error;
  }
}

/**
 * Function 5: Calculate score variance
 * 
 * @param rfpId - RFP identifier
 * @param supplierId - Supplier contact identifier
 * @returns Variance analysis
 */
export async function calculateScoreVariance(
  rfpId: string,
  supplierId: string
): Promise<{
  perItemVariance: Array<{
    requirementId: string;
    requirementTitle: string;
    autoScore: number;
    overrideScore: number | null;
    variance: number;
    varianceLevel: 'low' | 'medium' | 'high';
  }>;
  totalVariance: number;
  averageVariance: number;
  maxVariance: number;
  itemsWithHighVariance: number;
}> {
  try {
    // 1. Fetch RFP
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId }
    });

    if (!rfp) {
      const error = new Error('RFP not found');
      (error as any).status = 404;
      throw error;
    }

    // 2. Fetch SupplierResponse
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      }
    });

    if (!supplierResponse) {
      const error = new Error('Supplier response not found');
      (error as any).status = 404;
      throw error;
    }

    // 3. Parse scoringMatrixSnapshot
    const scoringMatrixSnapshot = rfp.scoringMatrixSnapshot as any;
    if (!scoringMatrixSnapshot || !scoringMatrixSnapshot.requirements) {
      const error = new Error('Scoring matrix not configured for this RFP');
      (error as any).status = 400;
      throw error;
    }

    // 4. Parse auto-scores
    const autoScores = (supplierResponse.autoScoreJson as unknown as RequirementScore[]) || [];
    const autoScoresMap = new Map<string, RequirementScore>();
    autoScores.forEach((score) => {
      autoScoresMap.set(score.requirementId, score);
    });

    // 5. Parse overrides
    const overrides = (supplierResponse.overrides as unknown as Record<string, OverrideRecord>) || {};

    // 6. Calculate variance for each requirement
    const perItemVariance: Array<{
      requirementId: string;
      requirementTitle: string;
      autoScore: number;
      overrideScore: number | null;
      variance: number;
      varianceLevel: 'low' | 'medium' | 'high';
    }> = [];

    let totalVariance = 0;
    let maxVariance = 0;
    let itemsWithHighVariance = 0;
    let itemsWithOverrides = 0;

    for (const requirement of scoringMatrixSnapshot.requirements) {
      const requirementId = requirement.id;
      const autoScoreData = autoScoresMap.get(requirementId);
      const autoScore = autoScoreData?.autoScore?.rawScore || 0;
      const override = overrides[requirementId];
      const overrideScore = override ? override.score : null;

      const variance = overrideScore !== null ? Math.abs(autoScore - overrideScore) : 0;
      const varianceLevel: 'low' | 'medium' | 'high' = 
        variance <= 1 ? 'low' : 
        variance <= 3 ? 'medium' : 
        'high';

      perItemVariance.push({
        requirementId,
        requirementTitle: requirement.question || requirement.title || 'Untitled Requirement',
        autoScore,
        overrideScore,
        variance,
        varianceLevel
      });

      if (overrideScore !== null) {
        totalVariance += variance;
        itemsWithOverrides++;
        maxVariance = Math.max(maxVariance, variance);
        
        if (varianceLevel === 'high') {
          itemsWithHighVariance++;
        }
      }
    }

    const averageVariance = itemsWithOverrides > 0 ? totalVariance / itemsWithOverrides : 0;

    return {
      perItemVariance,
      totalVariance,
      averageVariance,
      maxVariance,
      itemsWithHighVariance
    };

  } catch (error) {
    console.error('Error in calculateScoreVariance:', error);
    throw error;
  }
}
