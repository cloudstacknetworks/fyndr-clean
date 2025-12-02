/**
 * STEP 41: Award API - POST Commit Award Decision
 * Finalizes and persists the award decision
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { finalizeAwardDecision } from "@/lib/award/award-service";
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
    const { selectedSupplierId, status, buyerNotes, supplierOutcomeMap } = body;

    // Validate required fields
    if (!status || !["recommended", "awarded", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'recommended', 'awarded', or 'cancelled'" },
        { status: 400 }
      );
    }

    // Finalize award decision
    const result = await finalizeAwardDecision(
      {
        rfpId,
        selectedSupplierId: selectedSupplierId || null,
        status,
        buyerNotes: buyerNotes || "",
        supplierOutcomeMap,
      },
      user.id
    );

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.AWARD_COMMITTED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Award decision committed: ${status}`,
      details: {
        selectedSupplierId: selectedSupplierId || null,
        status,
        hasNotes: !!buyerNotes,
      },
    });

    // Also log status change
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.AWARD_STATUS_CHANGED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Award status changed to: ${status}`,
      details: {
        newStatus: status,
        selectedSupplierId: selectedSupplierId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        rfp: result.rfp,
        snapshot: result.snapshot,
      },
      message: `Award decision committed: ${status}`,
    });
  } catch (error: any) {
    console.error("Error committing award decision:", error);
    return NextResponse.json(
      { error: error.message || "Failed to commit award decision" },
      { status: 500 }
    );
  }
}
