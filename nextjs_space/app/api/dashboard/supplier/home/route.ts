/**
 * STEP 54: Supplier Work Inbox & Notifications Panel
 * API endpoint for supplier home dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { buildSupplierInbox } from '@/lib/supplier-inbox/supplier-inbox-engine';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

/**
 * GET /api/dashboard/supplier/home
 * Fetches supplier inbox data
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Enforce supplier role
    if (session.user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Forbidden - Supplier access only' },
        { status: 403 }
      );
    }
    
    const userId = session.user.id;
    
    // Build inbox data
    const inboxData = await buildSupplierInbox(userId);
    
    // Log activity event
    await logActivityWithRequest(req, {
      userId,
      eventType: EVENT_TYPES.SUPPLIER_INBOX_VIEWED,
      actorRole: ACTOR_ROLES.SUPPLIER,
      summary: `Supplier viewed work inbox`,
      details: {
        userId,
        pendingActionsCount: inboxData.counts.pendingActionsCount,
        deadlinesCount: inboxData.counts.deadlinesCount,
        invitationsCount: inboxData.counts.invitationsCount,
        activityCount: inboxData.counts.activityCount
      }
    });
    
    return NextResponse.json(inboxData);
    
  } catch (error) {
    console.error('[SUPPLIER_INBOX_API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
