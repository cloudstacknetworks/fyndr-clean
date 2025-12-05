/**
 * STEP 59: Auto-Scoring Regenerate Endpoint
 * POST /api/dashboard/rfps/[id]/auto-score/regenerate
 * 
 * Regenerates auto-scores for all suppliers while preserving buyer overrides
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scoreSupplierResponse } from '@/lib/scoring/auto-scoring-engine';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

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
        { error: 'Forbidden - Only buyers can regenerate scores' },
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

    const rfpId = params.id;

    // 4. Fetch RFP and verify company scoping
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
      return NextResponse.json(
        { error: 'RFP not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Regenerate scores for each supplier
    // scoreSupplierResponse already handles merging with existing overrides
    let successCount = 0;
    let failureCount = 0;

    for (const supplierResponse of rfp.supplierResponses) {
      try {
        await scoreSupplierResponse(
          rfpId,
          supplierResponse.supplierContactId,
          companyId,
          userId
        );
        successCount++;
      } catch (error) {
        console.error(`Error regenerating scores for supplier ${supplierResponse.supplierContactId}:`, error);
        failureCount++;
      }
    }

    // 6. Log activity
    await logActivity({
      eventType: 'AUTO_SCORE_REGENERATED',
      summary: `Auto-scores regenerated for all suppliers`,
      rfpId: rfpId,
      userId: userId,
      actorRole: 'BUYER',
      details: {
        totalSuppliers: rfp.supplierResponses.length,
        successCount,
        failureCount,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-scores regenerated successfully (buyer overrides preserved)',
      summary: {
        totalSuppliers: rfp.supplierResponses.length,
        successCount,
        failureCount
      }
    });

  } catch (error) {
    console.error('Error in auto-score regenerate endpoint:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to regenerate auto-scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
