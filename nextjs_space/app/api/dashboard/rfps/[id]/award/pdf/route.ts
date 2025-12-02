/**
 * STEP 41: Award API - GET Award Decision PDF
 * Generates and exports award decision as PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAwardStatus } from "@/lib/award/award-service";
import { generateAwardDecisionHtml } from "@/lib/award/award-pdf-generator";
import { generatePdfFromHtml } from "@/lib/export-utils";
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

    // Generate HTML
    const html = generateAwardDecisionHtml(rfp, awardData.awardSnapshot);

    // Generate PDF
    const pdfBuffer = await generatePdfFromHtml(html);

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.AWARD_PDF_EXPORTED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Award decision PDF exported (status: ${awardData.awardStatus || "unknown"})`,
      details: {
        awardStatus: awardData.awardStatus,
        awardedSupplierId: awardData.awardedSupplierId,
      },
    });

    // Return PDF
    const filename = `award-decision-${rfp.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating award PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate award PDF" },
      { status: 500 }
    );
  }
}
