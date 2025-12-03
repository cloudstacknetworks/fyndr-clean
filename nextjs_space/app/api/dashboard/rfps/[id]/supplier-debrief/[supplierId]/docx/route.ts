/**
 * STEP 42.5: Supplier Debrief Pack API - GET DOCX Export
 * Generates and exports supplier debrief as Word (.docx) document
 * 
 * SECURITY:
 * - Buyer-only access (403 for suppliers)
 * - Company-scoped (buyers can only access RFPs in their company)
 * - Requires authentication (401 for unauthenticated)
 * - Logs SUPPLIER_DEBRIEF_EXPORTED_DOCX activity event
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildSupplierDebriefData } from "@/lib/debrief/debrief-pack-service";
import { generateSupplierDebriefDocx } from "@/lib/debrief/debrief-pack-docx-generator";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; supplierId: string } }
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
        { error: "Forbidden - buyers only. Suppliers cannot access debrief data." },
        { status: 403 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;

    // Load RFP for company scope validation
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        companyId: true,
        userId: true,
        scoringMatrixSnapshot: true,
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Check if scoring matrix snapshot exists
    if (!rfp.scoringMatrixSnapshot) {
      return NextResponse.json(
        { error: "No scoring matrix found. Please run comparison scoring first." },
        { status: 400 }
      );
    }

    // Company scope check - user must be from the same company as the RFP
    const userBelongsToCompany = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        OR: [
          { userId: user.id },
          { companyId: user.id },
          {
            company: {
              rfps: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        ],
      },
    });

    if (!userBelongsToCompany) {
      return NextResponse.json(
        { error: "Access denied - company scope violation" },
        { status: 403 }
      );
    }

    // Build supplier debrief data
    const debriefData = await buildSupplierDebriefData(rfpId, supplierId);

    // Generate DOCX buffer
    const buffer = await generateSupplierDebriefDocx(debriefData);

    // Sanitize supplier name for filename
    const sanitizedSupplierName = debriefData.supplierName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.SUPPLIER_DEBRIEF_EXPORTED_DOCX,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: user.id,
      summary: `Supplier debrief pack exported as Word document for ${debriefData.supplierName}`,
      details: {
        supplierId,
        supplierName: debriefData.supplierName,
        overallScore: debriefData.overallScore,
        rank: debriefData.rank,
        format: 'docx',
      },
    });

    // Return DOCX with proper filename
    const filename = `Supplier_Debrief_${sanitizedSupplierName}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating supplier debrief DOCX:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate supplier debrief Word document" },
      { status: 500 }
    );
  }
}
