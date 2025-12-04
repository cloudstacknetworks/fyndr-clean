/**
 * Multi-RFP Comparison PDF Export API (STEP 49)
 * 
 * POST /api/dashboard/rfps/compare-multi/export-pdf
 * 
 * Exports multi-RFP comparison as PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { compareRfps } from "@/lib/compare/multi-rfp-compare-engine";
import { generateMultiRfpComparisonPdf } from "@/lib/compare/multi-rfp-compare-pdf-generator";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

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

    // Generate PDF
    const pdfBuffer = await generateMultiRfpComparisonPdf(comparisonData);

    // Log activity
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.MULTI_RFP_COMPARE_EXPORTED_PDF,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      summary: `Multi-RFP comparison exported as PDF (${rfpIds.length} RFPs)`,
      details: {
        rfpIds,
        userId,
        companyId,
        timestamp: new Date().toISOString(),
      },
    });

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="multi-rfp-comparison-${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Multi-RFP comparison PDF export error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
