/**
 * Portfolio Insights JSON API (STEP 44)
 * 
 * GET /api/dashboard/portfolio/insights
 * 
 * Returns comprehensive portfolio-level analytics for the company.
 * Buyer-only access, company-scoped, 401 for unauthenticated.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildPortfolioInsights } from "@/lib/portfolio/portfolio-insights-engine";
import { logActivity } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Buyer-only check
    if (session.user.role !== "BUYER") {
      return NextResponse.json(
        { error: "Forbidden. This feature is only available to buyers." },
        { status: 403 }
      );
    }

    // 3. Get user's company ID from database
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rfps: {
          take: 1,
          select: { companyId: true },
        },
      },
    });

    if (!user || user.rfps.length === 0) {
      return NextResponse.json(
        { error: "No RFPs found for your account." },
        { status: 404 }
      );
    }

    const companyId = user.rfps[0].companyId;

    // 4. Build portfolio insights
    const insights = await buildPortfolioInsights(companyId, userId);

    // 5. Log activity
    await logActivity({
      eventType: EVENT_TYPES.PORTFOLIO_INSIGHTS_VIEWED,
      actorRole: ACTOR_ROLES.BUYER,
      summary: "Portfolio insights viewed",
      userId,
      details: {
        totalRfps: insights.highLevelCounts.totalRfps,
        generatedAt: insights.generatedAt,
      },
    });

    // 6. Return insights
    return NextResponse.json(insights, { status: 200 });
  } catch (error) {
    console.error("Error fetching portfolio insights:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
