/**
 * STEP 53: Preferences API Endpoint
 * GET /api/dashboard/settings/preferences - Fetch user preferences
 * PUT /api/dashboard/settings/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/settings/preferences
 * Fetch user preferences for the authenticated buyer
 */
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
        { error: 'Forbidden. Only buyers can access preferences.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // ========================================
    // Fetch User Preferences
    // ========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Parse preferences JSON or return defaults
    const preferences = user.preferences ? (user.preferences as any) : {
      defaultRfpPriority: 'MEDIUM',
      defaultRfpStage: 'INTAKE',
      autoAssignSuppliers: false,
      enableAutoNotifications: true,
      defaultTimezone: 'America/New_York',
      requireApprovalForAward: true,
    };

    // ========================================
    // Return Preferences
    // ========================================
    return NextResponse.json({
      success: true,
      preferences,
    });
    
  } catch (error) {
    console.error('[Preferences GET API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching preferences.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/settings/preferences
 * Update user preferences for the authenticated buyer
 */
export async function PUT(request: NextRequest) {
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
        { error: 'Forbidden. Only buyers can update preferences.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // ========================================
    // Parse Request Body
    // ========================================
    const body = await request.json();
    const {
      defaultRfpPriority,
      defaultRfpStage,
      autoAssignSuppliers,
      enableAutoNotifications,
      defaultTimezone,
      requireApprovalForAward,
    } = body;

    // Validate priority
    if (defaultRfpPriority && !['LOW', 'MEDIUM', 'HIGH'].includes(defaultRfpPriority)) {
      return NextResponse.json(
        { error: 'Invalid default priority. Must be LOW, MEDIUM, or HIGH.' },
        { status: 400 }
      );
    }

    // Validate stage
    const validStages = ['INTAKE', 'QUALIFICATION', 'DISCOVERY', 'DRAFTING', 'PRICING_LEGAL_REVIEW', 'EXEC_REVIEW', 'SUBMISSION', 'DEBRIEF', 'ARCHIVED'];
    if (defaultRfpStage && !validStages.includes(defaultRfpStage)) {
      return NextResponse.json(
        { error: 'Invalid default stage.' },
        { status: 400 }
      );
    }

    // ========================================
    // Build Preferences Object
    // ========================================
    const preferences: any = {};
    if (defaultRfpPriority !== undefined) preferences.defaultRfpPriority = defaultRfpPriority;
    if (defaultRfpStage !== undefined) preferences.defaultRfpStage = defaultRfpStage;
    if (autoAssignSuppliers !== undefined) preferences.autoAssignSuppliers = autoAssignSuppliers;
    if (enableAutoNotifications !== undefined) preferences.enableAutoNotifications = enableAutoNotifications;
    if (defaultTimezone !== undefined) preferences.defaultTimezone = defaultTimezone;
    if (requireApprovalForAward !== undefined) preferences.requireApprovalForAward = requireApprovalForAward;

    // ========================================
    // Fetch Existing Preferences
    // ========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const existingPreferences = user?.preferences ? (user.preferences as any) : {};

    // Merge with existing preferences
    const updatedPreferences = {
      ...existingPreferences,
      ...preferences,
    };

    // ========================================
    // Update User Preferences
    // ========================================
    await prisma.user.update({
      where: { id: userId },
      data: { preferences: updatedPreferences },
    });

    // ========================================
    // Log Activity
    // ========================================
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.SETTINGS_PREFERENCES_UPDATED,
        actorRole: ACTOR_ROLES.BUYER,
        userId: userId,
        summary: `${session.user.name || session.user.email} updated their preferences`,
        details: {
          userId,
          updatedFields: Object.keys(preferences),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[Preferences PUT API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Updated Preferences
    // ========================================
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: updatedPreferences,
    });
    
  } catch (error) {
    console.error('[Preferences PUT API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating preferences.' },
      { status: 500 }
    );
  }
}
