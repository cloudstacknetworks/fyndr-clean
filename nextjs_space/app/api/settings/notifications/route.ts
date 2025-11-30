/**
 * Notification Preferences API
 * STEP 22: Notifications & Reminders Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getNotificationPreferences } from '@/lib/notifications';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create preferences
    const prefs = await getNotificationPreferences(session.user.id);

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const allowedFields = [
      'emailEnabled',
      'inAppEnabled',
      'buyerRfpTimeline',
      'buyerSupplierResponses',
      'buyerSupplierQuestions',
      'buyerQABroadcasts',
      'buyerReadinessChanges',
      'supplierQATimeline',
      'supplierSubmissionTimeline',
      'supplierBroadcasts',
      'supplierResponseStatus',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'boolean') {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update preferences (upsert)
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
