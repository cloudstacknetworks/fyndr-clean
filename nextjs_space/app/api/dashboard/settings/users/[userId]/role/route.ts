/**
 * STEP 53: User Role Change API Endpoint
 * PUT /api/dashboard/settings/users/[userId]/role - Change user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/dashboard/settings/users/[userId]/role
 * Change user role
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
        { error: 'Forbidden. Only buyers can change user roles.' },
        { status: 403 }
      );
    }

    const currentUserId = session.user.id;
    const targetUserId = params.userId;

    // Prevent users from changing their own role
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: 'You cannot change your own role.' },
        { status: 403 }
      );
    }

    // ========================================
    // Parse Request Body
    // ========================================
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['buyer', 'supplier'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "buyer" or "supplier".' },
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

    const oldRole = targetUser.role;

    // ========================================
    // Update User Role
    // ========================================
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: role },
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
        eventType: EVENT_TYPES.SETTINGS_USER_ROLE_CHANGED,
        actorRole: ACTOR_ROLES.BUYER,
        userId: currentUserId,
        summary: `${session.user.name || session.user.email} changed role of ${targetUser.name || targetUser.email} from ${oldRole} to ${role}`,
        details: {
          currentUserId,
          targetUserId,
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name,
          oldRole,
          newRole: role,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[User Role Change API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Success
    // ========================================
    return NextResponse.json({
      success: true,
      message: `User role changed from ${oldRole} to ${role}.`,
      user: updatedUser,
    });
    
  } catch (error) {
    console.error('[User Role Change API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while changing user role.' },
      { status: 500 }
    );
  }
}
