/**
 * Multi-RFP Comparison DOCX Export API (STEP 49)
 * 
 * POST /api/dashboard/rfps/compare-multi/export-docx
 * 
 * Exports multi-RFP comparison as DOCX
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { compareRfps } from "@/lib/compare/multi-rfp-compare-engine";
import { generateMultiRfpComparisonDocx } from "@/lib/compare/multi-rfp-compare-docx-generator";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import { Packer } from "docx";

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization: Buyer-only access
    if (session.user.role !== "buyer") {
      return NextResponse.json(
        { error: "Forbidden: Supplier role cannot access" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { rfpIds } = body;

    // Validation
    if (!rfpIds || !Array.isArray(rfpIds) || rfpIds.length < 2 || rfpIds.length > 5) {
      return NextResponse.json(
        { error: "Invalid rfpIds" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get companyId from user's RFPs
    const { prisma } = await import("@/lib/prisma");
    const userRfp = await prisma.rFP.findFirst({
      where: { userId },
      select: { companyId: true },
    });

    if (!userRfp) {
      return NextResponse.json(
        { error: "No RFPs found for user" },
        { status: 404 }
      );
    }

    const companyId = userRfp.companyId;

    // Execute comparison
    const comparisonData = await compareRfps(rfpIds, companyId, userId);

    // Generate DOCX
    const doc = await generateMultiRfpComparisonDocx(comparisonData);
    const docxBuffer = await Packer.toBuffer(doc);

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.MULTI_RFP_COMPARE_EXPORTED_DOCX,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      summary: `Multi-RFP comparison exported as DOCX (${rfpIds.length} RFPs)`,
      details: {
        rfpIds,
        userId,
        companyId,
        timestamp: new Date().toISOString(),
      },
    });

    // Return DOCX
    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="multi-rfp-comparison-${Date.now()}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Multi-RFP comparison DOCX export error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
