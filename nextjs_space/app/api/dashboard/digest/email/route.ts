/**
 * STEP 52: Buyer Email Digest API Endpoint
 * POST /api/dashboard/digest/email
 * 
 * Generates a personalized email digest for the authenticated buyer.
 * 
 * Security:
 * - Requires authentication (NextAuth session)
 * - Company isolation enforced
 * - Activity logging enabled
 * 
 * Request Body:
 * {
 *   "timeframe": "week" | "month"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": EmailDigestData (includes htmlContent)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { buildBuyerEmailDigest } from '@/lib/digest/email-digest-engine';
import { logActivity } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // ========================================
    // Step 1: Authenticate user
    // ========================================
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // ========================================
    // Step 2: Get user and company info
    // ========================================
    const userId = session.user.id;
    const userName = session.user.name || session.user.email;
    
    // Fetch user's companyId from their first RFP
    const firstRfp = await prisma.rFP.findFirst({
      where: { userId: userId },
      select: { companyId: true },
    });
    
    if (!firstRfp || !firstRfp.companyId) {
      return NextResponse.json(
        { success: false, error: 'No RFPs found for this user.' },
        { status: 404 }
      );
    }
    
    const companyId = firstRfp.companyId;

    // ========================================
    // Step 3: Parse request body
    // ========================================
    const body = await request.json();
    const timeframe = body.timeframe === 'month' ? 'month' : 'week';

    console.log(`[Email Digest API] Generating ${timeframe} digest for user ${userId} (${userName})`);

    // ========================================
    // Step 4: Generate digest using engine
    // ========================================
    const digestData = await buildBuyerEmailDigest(
      userId,
      companyId,
      timeframe
    );

    // ========================================
    // Step 5: Log activity (DIGEST_EMAIL_PREVIEWED)
    // ========================================
    try {
      await logActivity({
        userId: userId,
        eventType: EVENT_TYPES.DIGEST_EMAIL_PREVIEWED,
        actorRole: ACTOR_ROLES.BUYER,
        summary: `${userName} generated a ${timeframe}ly email digest`,
        details: {
          timeframe,
          activeRfpsCount: digestData.summary.activeRfpsCount,
          dueSoonCount: digestData.summary.dueSoonCount,
          newAwardsCount: digestData.summary.newAwardsCount,
          newSubmissionsCount: digestData.summary.newSubmissionsCount,
          attentionItemsCount: digestData.summary.attentionItemsCount,
        },
      });
    } catch (logError) {
      console.error('[Email Digest API] Failed to log activity:', logError);
      // Non-blocking - continue execution
    }

    console.log(`[Email Digest API] Successfully generated digest with ${digestData.summary.activeRfpsCount} active RFPs`);

    // ========================================
    // Step 6: Return digest data
    // ========================================
    return NextResponse.json({
      success: true,
      data: digestData,
    });

  } catch (error: any) {
    console.error('[Email Digest API] Error generating digest:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate email digest',
      },
      { status: 500 }
    );
  }
}

// Only POST is supported
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
