/**
 * STEP 53: User Invitation API Endpoint
 * POST /api/dashboard/settings/users/invite - Invite a new user to the company
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * POST /api/dashboard/settings/users/invite
 * Invite a new user to the company
 */
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
        { error: 'Forbidden. Only buyers can invite users.' },
        { status: 403 }
      );
    }

    const inviterUserId = session.user.id;
    
    // Fetch user's companyId from their first RFP
    const firstRfp = await prisma.rFP.findFirst({
      where: { userId: inviterUserId },
      select: { companyId: true },
    });
    
    if (!firstRfp || !firstRfp.companyId) {
      return NextResponse.json(
        { error: 'No company found for this user.' },
        { status: 404 }
      );
    }
    
    const companyId = firstRfp.companyId;

    // ========================================
    // Parse Request Body
    // ========================================
    const body = await request.json();
    const { email, name, role } = body;

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Validate role (must be "buyer")
    if (role && role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyer role is supported for invitation.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    // ========================================
    // Create New User (Invited)
    // ========================================
    // Generate a temporary password (user should change it later)
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'; // Random password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name,
        password: hashedPassword,
        role: 'buyer',
        isActive: true,
        isDemo: false,
      },
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
        eventType: EVENT_TYPES.SETTINGS_USER_INVITED,
        actorRole: ACTOR_ROLES.BUYER,
        userId: inviterUserId,
        summary: `${session.user.name || session.user.email} invited ${name} (${email}) to the company`,
        details: {
          inviterUserId,
          invitedUserId: newUser.id,
          invitedEmail: email,
          invitedName: name,
          companyId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[User Invite API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Success (In a real app, send invitation email with temp password)
    // ========================================
    return NextResponse.json({
      success: true,
      message: `User ${name} has been invited successfully. (In production, an invitation email would be sent.)`,
      user: newUser,
      tempPassword: tempPassword, // Only for demo/dev purposes - in production, send via email
    });
    
  } catch (error) {
    console.error('[User Invite API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while inviting user.' },
      { status: 500 }
    );
  }
}
