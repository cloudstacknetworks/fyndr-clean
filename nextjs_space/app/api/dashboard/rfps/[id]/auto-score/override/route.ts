/**
 * STEP 59: Auto-Scoring Buyer Override Endpoint
 * POST /api/dashboard/rfps/[id]/auto-score/override
 * 
 * Allows buyers to override auto-generated scores for specific requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { RequirementScore } from '@/lib/scoring/auto-scoring-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validate session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Enforce buyer-only access
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden - Only buyers can override scores' },
        { status: 403 }
      );
    }

    // 3. Get company ID and user ID from session
    const companyId = session.user.companyId;
    const userId = session.user.id;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found in session' },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await req.json();
    const { supplierId, requirementId, overrideScore, overrideReason, removeOverride } = body;

    if (!supplierId || !requirementId) {
      return NextResponse.json(
        { error: 'Missing required fields: supplierId, requirementId' },
        { status: 400 }
      );
    }

    if (!removeOverride && (overrideScore === undefined || overrideScore === null)) {
      return NextResponse.json(
        { error: 'Missing overrideScore' },
        { status: 400 }
      );
    }

    const rfpId = params.id;

    // 5. Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: companyId
      }
    });

    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found or access denied' },
        { status: 404 }
      );
    }

    // 6. Fetch SupplierResponse
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      }
    });

    if (!supplierResponse) {
      return NextResponse.json(
        { error: 'Supplier response not found' },
        { status: 404 }
      );
    }

    // 7. Get current autoScoreJson
    const currentScores = (supplierResponse.autoScoreJson as any as RequirementScore[]) || [];

    // 8. Find and update the specific requirement score
    const updatedScores = currentScores.map((score) => {
      if (score.requirementId === requirementId) {
        // Remove override if requested
        if (removeOverride) {
          const { buyerOverride, ...scoreWithoutOverride } = score;
          return scoreWithoutOverride;
        }
        
        // Add or update override
        const previousScore = score.buyerOverride?.overrideScore || score.autoScore.rawScore;
        
        return {
          ...score,
          buyerOverride: {
            overrideScore: overrideScore,
            overrideReason: overrideReason || undefined,
            overriddenAt: new Date().toISOString(),
            overriddenByUserId: userId
          }
        };
      }
      return score;
    });

    // 9. Update SupplierResponse with new scores
    await prisma.supplierResponse.update({
      where: { id: supplierResponse.id },
      data: {
        autoScoreJson: updatedScores as any
      }
    });

    // 10. Log activity
    const targetScore = currentScores.find(s => s.requirementId === requirementId);
    const beforeScore = targetScore?.buyerOverride?.overrideScore || targetScore?.autoScore.rawScore;

    await logActivity({
      eventType: removeOverride ? 'AUTO_SCORE_OVERRIDDEN' : 'AUTO_SCORE_OVERRIDDEN',
      summary: removeOverride 
        ? `Buyer override removed for requirement ${requirementId}`
        : `Buyer override applied for requirement ${requirementId}`,
      rfpId: rfpId,
      supplierResponseId: supplierResponse.id,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        supplierId,
        requirementId,
        beforeScore,
        afterScore: removeOverride ? targetScore?.autoScore.rawScore : overrideScore,
        overrideReason: overrideReason || 'No reason provided',
        removed: removeOverride || false,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: removeOverride ? 'Override removed successfully' : 'Override applied successfully',
      scores: updatedScores
    });

  } catch (error) {
    console.error('Error in auto-score override endpoint:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to apply override',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
