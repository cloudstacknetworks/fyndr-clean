/**
 * STEP 41: Award API - POST Preview Award Snapshot
 * Builds and returns award snapshot without persisting
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildAwardSnapshotPreview } from "@/lib/award/award-service";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Buyer-only check
    if (user.role !== "buyer") {
      return NextResponse.json(
        { error: "Forbidden - buyers only" },
        { status: 403 }
      );
    }

    const rfpId = params.id;

    // Company scope check
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        companyId: true,
        userId: true,
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { selectedSupplierId, status, buyerNotes } = body;

    // Validate required fields
    if (!status || !["recommended", "awarded", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'recommended', 'awarded', or 'cancelled'" },
        { status: 400 }
      );
    }

    // Build preview snapshot
    const snapshot = await buildAwardSnapshotPreview(
      rfpId,
      selectedSupplierId || null,
      status,
      buyerNotes || "",
      user.id
    );

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.AWARD_PREVIEWED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Award decision previewed (status: ${status})`,
      details: {
        selectedSupplierId: selectedSupplierId || null,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        preview: snapshot,
      },
    });
  } catch (error: any) {
    console.error("Error building award preview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to build award preview" },
      { status: 500 }
    );
  }
}
