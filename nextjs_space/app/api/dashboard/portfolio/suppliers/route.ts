/**
 * Portfolio Top Suppliers API (STEP 35)
 * GET /api/dashboard/portfolio/suppliers
 * 
 * Returns top suppliers across the buyer's portfolio.
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
        topSuppliers: [],
        meta: {
          asOf: new Date().toISOString(),
          totalSuppliers: 0,
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
      topSuppliers: snapshot.topSuppliers,
      meta: {
        asOf: snapshot.asOf,
        totalSuppliers: snapshot.topSuppliers.length,
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/portfolio/suppliers] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
