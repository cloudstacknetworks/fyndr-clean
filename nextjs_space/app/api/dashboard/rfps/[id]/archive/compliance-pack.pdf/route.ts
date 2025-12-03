/**
 * STEP 47: Archive API - GET Compliance Pack PDF
 * Generates and exports compliance pack as PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateCompliancePackHtml } from "@/lib/archive/compliance-pack-pdf-generator";
import { generatePdfFromHtml } from "@/lib/export-utils";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import { prisma } from "@/lib/prisma";
import type { CompliancePackSnapshot } from "@/lib/archive/compliance-pack-service";

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
      select: {
        id: true,
        title: true,
        companyId: true,
        userId: true,
        isArchived: true,
        compliancePackSnapshot: true,
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Check if archived
    if (!rfp.isArchived || !rfp.compliancePackSnapshot) {
      return NextResponse.json(
        { error: "RFP is not archived or compliance pack not available. Please archive the RFP first." },
        { status: 400 }
      );
    }

    const snapshot = rfp.compliancePackSnapshot as unknown as CompliancePackSnapshot;

    // Generate HTML
    const html = generateCompliancePackHtml(rfp.title, snapshot);

    // Generate PDF
    const pdfBuffer = await generatePdfFromHtml(html);

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.COMPLIANCE_PACK_EXPORTED_PDF,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Compliance pack PDF exported`,
      details: {
        format: 'pdf',
        archivedAt: snapshot.timeline.archivedAt,
      },
    });

    // Return PDF
    const filename = `compliance-pack-${rfp.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating compliance pack PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate compliance pack PDF" },
      { status: 500 }
    );
  }
}
