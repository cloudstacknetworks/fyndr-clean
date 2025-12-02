/**
 * STEP 39: Requirement-Level Scoring Matrix - GET Endpoint
 * 
 * GET /api/dashboard/rfps/[id]/comparison/matrix
 * 
 * Retrieves the scoring matrix for an RFP.
 * - If cached snapshot exists, returns it
 * - Otherwise, computes it on-the-fly and caches it
 * 
 * Access: Buyer users only, must own the RFP's company
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { getScoringMatrix } from '@/lib/comparison/scoring-matrix';

const prisma = new PrismaClient();

export async function GET(
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

    // 4. Get matrix (from cache or recompute)
    const matrix = await getScoringMatrix(rfpId, true);

    if (!matrix) {
      return NextResponse.json(
        { error: 'Failed to generate scoring matrix. Ensure RFP has supplier responses.' },
        { status: 500 }
      );
    }

    // 5. Enrich supplier summaries with actual supplier names
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

    return NextResponse.json({
      success: true,
      matrix: enrichedMatrix,
    });
  } catch (error) {
    console.error('Error fetching scoring matrix:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
