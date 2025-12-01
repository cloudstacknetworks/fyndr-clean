/**
 * Portfolio Risks API (STEP 35)
 * GET /api/dashboard/portfolio/risks
 * 
 * Returns risk bands and readiness distribution across the buyer's portfolio.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { composePortfolioSnapshotForCompany } from '@/lib/portfolio/portfolio-composer';

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: buyer-only
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyers only' }, { status: 403 });
    }

    // Get user's company ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        rfps: {
          take: 1,
          select: { companyId: true },
        },
      },
    });

    if (!user || user.rfps.length === 0) {
      return NextResponse.json({
        riskBands: [
          { band: 'low', rfps: 0, suppliers: 0, topRiskLabels: [] },
          { band: 'medium', rfps: 0, suppliers: 0, topRiskLabels: [] },
          { band: 'high', rfps: 0, suppliers: 0, topRiskLabels: [] },
        ],
        readinessDistribution: {
          excellentCount: 0,
          goodCount: 0,
          moderateCount: 0,
          lowCount: 0,
          averageReadiness: null,
          sampleRfpIds: [],
        },
        meta: {
          asOf: new Date().toISOString(),
        },
      });
    }

    const companyId = user.rfps[0].companyId;

    // Compose portfolio snapshot (will use cache if fresh)
    const { snapshot } = await composePortfolioSnapshotForCompany(companyId, {
      useExistingSnapshotIfFresh: true,
      userId: session.user.id,
    });

    return NextResponse.json({
      riskBands: snapshot.riskBands,
      readinessDistribution: snapshot.readinessDistribution,
      meta: {
        asOf: snapshot.asOf,
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/portfolio/risks] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
