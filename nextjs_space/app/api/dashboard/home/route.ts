/**
 * STEP 50: Buyer Home Dashboard API Endpoint
 * GET /api/dashboard/home
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { buildBuyerHomeDashboard } from '@/lib/dashboard/home-dashboard-engine';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // Authentication & Authorization
    // ========================================
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden. Only buyers can access the home dashboard.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    
    // Fetch user's companyId from their first RFP
    const firstRfp = await prisma.rFP.findFirst({
      where: { userId: userId },
      select: { companyId: true },
    });
    
    if (!firstRfp || !firstRfp.companyId) {
      return NextResponse.json(
        { error: 'No RFPs found for this user.' },
        { status: 404 }
      );
    }
    
    const companyId = firstRfp.companyId;

    // ========================================
    // Build Dashboard Data
    // ========================================
    const dashboardData = await buildBuyerHomeDashboard(userId, companyId);

    // ========================================
    // Log Activity
    // ========================================
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.HOME_DASHBOARD_VIEWED,
        actorRole: ACTOR_ROLES.BUYER,
        userId: userId,
        summary: `${session.user.name || session.user.email} viewed the home dashboard`,
        details: {
          userId,
          companyId,
          timestamp: new Date().toISOString(),
          activeRfpsCount: dashboardData.stats.activeCount,
          dueSoonCount: dashboardData.stats.dueSoonCount,
          inEvaluationCount: dashboardData.stats.inEvaluationCount,
          awardedRecentCount: dashboardData.stats.awardedRecentCount,
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[Home Dashboard API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Dashboard Data
    // ========================================
    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
    
  } catch (error) {
    console.error('[Home Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching dashboard data.' },
      { status: 500 }
    );
  }
}
