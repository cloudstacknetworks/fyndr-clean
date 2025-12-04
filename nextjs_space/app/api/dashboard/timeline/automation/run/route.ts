/**
 * STEP 55: Timeline Automation API Endpoint
 * POST /api/dashboard/timeline/automation/run
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { runTimelineAutomation } from '@/lib/timeline/timeline-automation-engine';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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
        { error: 'Forbidden. Only buyers can run timeline automation.' },
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
    // Run Timeline Automation
    // ========================================
    const result = await runTimelineAutomation(companyId);

    // ========================================
    // Log Activity
    // ========================================
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.TIMELINE_AUTOMATION_RUN,
        actorRole: ACTOR_ROLES.BUYER,
        userId: userId,
        summary: `${session.user.name || session.user.email} ran timeline automation`,
        details: {
          userId,
          companyId,
          timestamp: new Date().toISOString(),
          autoAdvancedCount: result.autoAdvancedRfps.length,
          buyerRemindersCount: result.buyerReminders.length,
          supplierRemindersCount: result.supplierReminders.length,
          errorsCount: result.errors.length,
          totalRfpsProcessed: result.metadata.totalRfpsProcessed,
          executionTimeMs: result.metadata.executionTimeMs,
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[Timeline Automation API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Results
    // ========================================
    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error('[Timeline Automation API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while running timeline automation.' },
      { status: 500 }
    );
  }
}
