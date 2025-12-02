/**
 * STEP 39: Requirement-Level Scoring Matrix - EXPORT Endpoint
 * 
 * GET /api/dashboard/rfps/[id]/comparison/matrix/export
 * 
 * Exports the scoring matrix to CSV format.
 * Supports optional filters via query parameters:
 * - category: Filter by requirement category
 * - onlyDifferentiators: Show only requirements where suppliers differ
 * - onlyFailedOrPartial: Show only requirements with failures or partial scores
 * - searchTerm: Search in requirement labels and descriptions
 * 
 * Access: Buyer users only, must own the RFP's company
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { exportMatrixToCSV } from '@/lib/comparison/scoring-matrix';
import { MatrixFilters } from '@/lib/comparison/scoring-matrix-types';
import { logActivity } from '@/lib/activity-log';

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
        userId: true,
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

    // 4. Parse query parameters for filters
    const { searchParams } = new URL(req.url);
    const filters: MatrixFilters = {
      category: (searchParams.get('category') as any) || 'all',
      onlyDifferentiators: searchParams.get('onlyDifferentiators') === 'true',
      onlyFailedOrPartial: searchParams.get('onlyFailedOrPartial') === 'true',
      searchTerm: searchParams.get('searchTerm') || undefined,
    };

    // 5. Export matrix to CSV
    const csvData = await exportMatrixToCSV(rfpId, filters);

    // 6. Log activity
    await logActivity({
      eventType: 'comparison_matrix_exported',
      userId: session.user.id,
      actorRole: 'BUYER',
      summary: `Buyer exported scoring matrix for RFP ${rfpId}`,
      rfpId: rfpId,
      details: {
        filters,
        exportedAt: new Date().toISOString(),
      },
    });

    // 7. Return CSV file
    const filename = `scoring-matrix-${rfp.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`;
    
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting scoring matrix:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
