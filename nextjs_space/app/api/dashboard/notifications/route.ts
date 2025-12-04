/**
 * Global Notifications Center API (STEP 51)
 * 
 * Endpoint: GET /api/dashboard/notifications
 * 
 * Purpose: Fetch recent activity notifications for the authenticated buyer
 * Authorization: Buyer-only (403 for suppliers)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { buildBuyerNotifications } from "@/lib/notifications/notification-engine";
import { logActivity } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

export async function GET(req: NextRequest) {
  try {
    // 1. Validate authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // 2. Check user role - reject suppliers with 403
    if (session.user.role !== "buyer") {
      return NextResponse.json(
        { error: "Forbidden: Buyer-only feature" },
        { status: 403 }
      );
    }

    // 3. Get companyId from user's RFPs
    const userRfp = await prisma.rFP.findFirst({
      where: { userId: session.user.id },
      select: { companyId: true },
    });

    if (!userRfp || !userRfp.companyId) {
      // No RFPs for this user, return empty notifications
      return NextResponse.json({
        notifications: [],
        total: 0,
      });
    }

    const companyId = userRfp.companyId;

    // 4. Call buildBuyerNotifications to fetch and transform activity data
    const notificationData = await buildBuyerNotifications(
      session.user.id,
      companyId
    );

    // 5. Log NOTIFICATIONS_VIEWED activity event (non-blocking)
    try {
      await logActivity({
        userId: session.user.id,
        eventType: EVENT_TYPES.NOTIFICATIONS_VIEWED,
        actorRole: ACTOR_ROLES.BUYER,
        summary: `${session.user.name || session.user.email} viewed Notifications Center`,
        details: {
          totalNotifications: notificationData.total,
        },
      });
    } catch (logError) {
      // Log error but don't fail the request
      console.error("Failed to log NOTIFICATIONS_VIEWED activity:", logError);
    }

    // 6. Return JSON response
    return NextResponse.json(notificationData);
  } catch (error) {
    console.error("Error in GET /api/dashboard/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
