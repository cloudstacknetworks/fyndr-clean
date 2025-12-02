/**
 * STEP 39: Requirement-Level Scoring Matrix - RECOMPUTE Endpoint
 * 
 * POST /api/dashboard/rfps/[id]/comparison/matrix/recompute
 * 
 * Forces a recomputation of the scoring matrix for an RFP.
 * Useful when:
 * - New supplier responses are submitted
 * - Template or clauses are updated
 * - Buyer wants to refresh cached data
 * 
 * Access: Buyer users only, must own the RFP's company
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { buildScoringMatrix } from '@/lib/comparison/scoring-matrix';
import { logActivity } from '@/lib/activity-log';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role check - Buyer only
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Access denied. Buyers only.' }, { status: 403 });
    }

    const rfpId = params.id;

    // 3. Fetch RFP and verify company ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        companyId: true,
        title: true,
        userId: true,
        supplierResponses: {
          include: {
            supplierContact: {
              select: {
                id: true,
                name: true,
                email: true,
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Verify user belongs to same company
    const userRfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        userId: session.user.id,
      },
    });

    if (!userRfp) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 4. Parse request body for options
    const body = await req.json().catch(() => ({}));
    const options = {
      forceRecompute: true,
      userId: session.user.id,
      scoringConfigOverrides: body.scoringConfigOverrides,
    };

    // 5. Build matrix (force recompute)
    const matrix = await buildScoringMatrix(rfpId, options);

    if (!matrix) {
      return NextResponse.json(
        { error: 'Failed to recompute scoring matrix' },
        { status: 500 }
      );
    }

    // 6. Enrich supplier summaries with actual supplier names
    const enrichedMatrix = {
      ...matrix,
      supplierSummaries: matrix.supplierSummaries.map(summary => {
        const supplierResponse = rfp.supplierResponses.find(
          sr => sr.supplierContactId === summary.supplierId
        );
        return {
          ...summary,
          supplierName: supplierResponse?.supplierContact.name || summary.supplierName,
        };
      }),
    };

    // 7. Log activity
    await logActivity({
      eventType: 'comparison_matrix_recomputed',
      userId: session.user.id,
      actorRole: 'BUYER',
      summary: `Buyer recomputed scoring matrix for RFP ${rfpId}`,
      rfpId: rfpId,
      details: {
        totalRequirements: matrix.meta.totalRequirements,
        totalSuppliers: matrix.meta.totalSuppliers,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Scoring matrix recomputed successfully',
      matrix: enrichedMatrix,
    });
  } catch (error) {
    console.error('Error recomputing scoring matrix:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
