/**
 * STEP 47: Archive API - POST Commit Archive
 * Finalizes and persists the archive and compliance pack
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { finalizeCompliancePackAndArchive } from "@/lib/archive/compliance-pack-service";
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
        isArchived: true,
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Check if already archived
    if (rfp.isArchived) {
      return NextResponse.json(
        { error: "RFP is already archived" },
        { status: 400 }
      );
    }

    // Finalize and archive
    const result = await finalizeCompliancePackAndArchive(rfpId, user.id);

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.RFP_ARCHIVED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `RFP archived with compliance pack`,
      details: {
        archivedAt: result.rfp.archivedAt,
        archivedBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        rfp: result.rfp,
        snapshot: result.snapshot,
      },
      message: "RFP archived successfully",
    });
  } catch (error: any) {
    console.error("Error committing archive:", error);
    return NextResponse.json(
      { error: error.message || "Failed to archive RFP" },
      { status: 500 }
    );
  }
}
