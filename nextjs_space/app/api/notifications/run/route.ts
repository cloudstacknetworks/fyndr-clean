/**
 * Notification Runner Endpoint
 * STEP 22: Notifications & Reminders Engine
 * 
 * This endpoint should be called by external cron/scheduler (e.g., hourly or daily)
 * to process timeline-based reminders for all active RFPs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { runTimelineReminders } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Require authentication (any authenticated user can trigger this)
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the timeline reminders
    const result = await runTimelineReminders();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      message: `Processed ${result.processedRfps} RFPs and created ${result.notificationsCreated} notifications`,
    });
  } catch (error) {
    console.error('Error in notification runner:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET as well for easier testing
  return POST(request);
}
