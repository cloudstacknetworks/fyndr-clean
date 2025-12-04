/**
 * STEP 53: User Deactivation API Endpoint
 * PUT /api/dashboard/settings/users/[userId]/deactivate - Deactivate/reactivate user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/dashboard/settings/users/[userId]/deactivate
 * Deactivate or reactivate a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
        { error: 'Forbidden. Only buyers can deactivate users.' },
        { status: 403 }
      );
    }

    const currentUserId = session.user.id;
    const targetUserId = params.userId;

    // Prevent users from deactivating themselves
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account.' },
        { status: 403 }
      );
    }

    // ========================================
    // Parse Request Body
    // ========================================
    const body = await request.json();
    const { isActive } = body;

    // Validate isActive
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isActive value. Must be true or false.' },
        { status: 400 }
      );
    }

    // ========================================
    // Fetch Target User
    // ========================================
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // ========================================
    // Update User Status
    // ========================================
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // ========================================
    // Log Activity
    // ========================================
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.SETTINGS_USER_DEACTIVATED,
        actorRole: ACTOR_ROLES.BUYER,
        userId: currentUserId,
        summary: `${session.user.name || session.user.email} ${isActive ? 'reactivated' : 'deactivated'} ${targetUser.name || targetUser.email}`,
        details: {
          currentUserId,
          targetUserId,
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name,
          action: isActive ? 'reactivated' : 'deactivated',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[User Deactivate API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Success
    // ========================================
    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'reactivated' : 'deactivated'} successfully.`,
      user: updatedUser,
    });
    
  } catch (error) {
    console.error('[User Deactivate API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while changing user status.' },
      { status: 500 }
    );
  }
}
