/**
 * Multi-RFP Comparison API Endpoint (STEP 49)
 * 
 * POST /api/dashboard/rfps/compare-multi
 * 
 * Executes multi-RFP comparison for 2-5 selected RFPs, aggregating
 * cross-RFP metrics, insights, and supplier participation data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { compareRfps } from "@/lib/compare/multi-rfp-compare-engine";
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

    // Validation: Ensure rfpIds is provided
    if (!rfpIds || !Array.isArray(rfpIds)) {
      return NextResponse.json(
        { error: "Invalid request: rfpIds array required" },
        { status: 400 }
      );
    }

    // Validation: Accept exactly 2-5 RFP IDs
    if (rfpIds.length < 2 || rfpIds.length > 5) {
      return NextResponse.json(
        { error: "Must provide between 2 and 5 RFP IDs for comparison" },
        { status: 400 }
      );
    }

    // Extract userId and companyId from session
    // We'll use the user's company from their first RFP
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
    const result = await compareRfps(rfpIds, companyId, userId);

    // Log activity: MULTI_RFP_COMPARE_RUN
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.MULTI_RFP_COMPARE_RUN,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      summary: `Multi-RFP comparison run for ${rfpIds.length} RFPs`,
      details: {
        rfpIds,
        userId,
        companyId,
        timestamp: new Date().toISOString(),
        resultCounts: {
          totalRfps: result.rfpComparisons.length,
          totalSupplierParticipation: result.crossInsights.totalSupplierParticipation,
          insightsGenerated: result.crossInsights.algorithmicInsights.length,
        },
      },
    });

    // Return comparison result
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Multi-RFP comparison error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
