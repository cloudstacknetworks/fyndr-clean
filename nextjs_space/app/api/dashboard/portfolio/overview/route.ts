/**
 * Portfolio Overview API (STEP 35)
 * GET /api/dashboard/portfolio/overview
 * 
 * Returns comprehensive portfolio snapshot for the authenticated buyer's company.
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
    const user = await prisma?.user.findUnique({
      where: { id: session.user.id },
      include: {
        rfps: {
          take: 1,
          select: { companyId: true },
        },
      },
    });

    if (!user || user.rfps.length === 0) {
      // No RFPs yet - return empty portfolio
      return NextResponse.json({
        snapshot: {
          companyId: 'unknown',
          asOf: new Date().toISOString(),
          generatedUsingAI: false,
          version: 1,
          timeRange: { from: null, to: null },
          kpis: {
            totalRfps: 0,
            activeRfps: 0,
            awardedRfps: 0,
            averageReadiness: null,
            averageCycleTimeDays: null,
          },
          stages: [],
          riskBands: [],
          readinessDistribution: {
            excellentCount: 0,
            goodCount: 0,
            moderateCount: 0,
            lowCount: 0,
            averageReadiness: null,
            sampleRfpIds: [],
          },
          topSuppliers: [],
          upcomingMilestones: [],
          spendSummary: {
            totalBudgetAllRfps: 0,
            totalAwardedSoFar: 0,
            inFlightBudget: 0,
            awardedCount: 0,
            inFlightCount: 0,
          },
        },
        meta: {
          version: 1,
          lastGeneratedAt: new Date().toISOString(),
          generatedUsingAI: false,
          isDemo: false,
          snapshotAgeMinutes: 0,
        },
      });
    }

    const companyId = user.rfps[0].companyId;

    // Compose portfolio snapshot
    const { snapshot, meta } = await composePortfolioSnapshotForCompany(companyId, {
      useExistingSnapshotIfFresh: true,
      userId: session.user.id,
    });

    return NextResponse.json({ snapshot, meta });
  } catch (error) {
    console.error('[GET /api/dashboard/portfolio/overview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
