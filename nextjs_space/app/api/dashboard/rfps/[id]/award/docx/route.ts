/**
 * STEP 41.5: Award API - GET Award Decision DOCX
 * Generates and exports award decision as Word (.docx) document
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAwardStatus } from "@/lib/award/award-service";
import { generateAwardDecisionDocx } from "@/lib/award/award-decision-docx-generator";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // Load RFP with full data
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        user: true,
        company: true,
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Get award status and snapshot
    const awardData = await getAwardStatus(rfpId);

    if (!awardData.awardSnapshot) {
      return NextResponse.json(
        { error: "No award decision found. Please commit an award decision first." },
        { status: 400 }
      );
    }

    // Generate DOCX buffer
    const buffer = await generateAwardDecisionDocx(rfp, awardData.awardSnapshot);

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.AWARD_EXPORTED_DOCX,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Award decision exported as Word document (status: ${awardData.awardStatus || "unknown"})`,
      details: {
        awardStatus: awardData.awardStatus,
        awardedSupplierId: awardData.awardedSupplierId,
        format: 'docx',
      },
    });

    // Return DOCX
    const filename = `award-decision-${rfp.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating award DOCX:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate award Word document" },
      { status: 500 }
    );
  }
}
