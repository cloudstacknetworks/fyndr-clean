/**
 * STEP 48: Global Search Engine API
 * PHASE 3: API Endpoint
 * 
 * GET /api/dashboard/search?q=<query>
 * - Buyer-only access
 * - Returns unified search results across all categories
 * - Logs search activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchAll } from '@/lib/search/global-search-engine';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    // Buyer-only access
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden - buyer access only' },
        { status: 403 }
      );
    }

    // Extract query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    // Get user's company ID from their RFPs
    const userId = session.user.id;
    const userRfp = await prisma.rFP.findFirst({
      where: { userId },
      select: { companyId: true },
    });

    const companyId = userRfp?.companyId || userId; // Fallback to userId if no RFP exists

    // Perform search
    const results = await searchAll(query, userId, companyId);

    // Calculate result counts per category
    const resultCounts = {
      rfps: results.rfpResults.length,
      suppliers: results.supplierResults.length,
      summaries: results.summaryResults.length,
      activities: results.activityResults.length,
      clauses: results.clauseResults.length,
      archivedRfps: results.archivedRfpResults.length,
      total:
        results.rfpResults.length +
        results.supplierResults.length +
        results.summaryResults.length +
        results.activityResults.length +
        results.clauseResults.length +
        results.archivedRfpResults.length,
    };

    // Log activity: GLOBAL_SEARCH_PERFORMED
    await logActivityWithRequest(request, {
      eventType: EVENT_TYPES.GLOBAL_SEARCH_PERFORMED,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      summary: `Global search performed: "${query}" - ${resultCounts.total} results`,
      details: {
        query,
        resultCounts,
        timestamp: new Date().toISOString(),
      },
    });

    // Return results
    return NextResponse.json({
      success: true,
      query,
      results,
      resultCounts,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
