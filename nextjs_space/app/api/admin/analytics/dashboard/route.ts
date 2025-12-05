/**
 * STEP 64: Admin Analytics Dashboard API Endpoint
 * GET /api/admin/analytics/dashboard
 * 
 * Provides portfolio-level analytics for admin users including KPIs and charts.
 * 
 * Security:
 * - Requires authentication (NextAuth session)
 * - Admin-only access (role === "buyer")
 * - Company isolation enforced (all data scoped to user's companyId)
 * - Activity logging enabled
 * 
 * Query Parameters:
 * - dateRange: "last_30_days" | "last_90_days" | "last_180_days" | "last_365_days" | "custom"
 * - startDate: ISO string (required if dateRange = "custom")
 * - endDate: ISO string (required if dateRange = "custom")
 * - buyerId: optional buyer filter
 * - stage: optional RFPStage filter
 * - status: optional "active" | "closed" | "all"
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": AdminAnalyticsDashboard (includes kpis and charts)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildAdminAnalyticsDashboard, AdminAnalyticsFilters } from "@/lib/analytics/admin-analytics-service";
import { logActivity } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import { RFPStage } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // Step 1: Authenticate user
    // ========================================
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // ========================================
    // Step 2: Validate admin access
    // ========================================
    const userRole = session.user.role;
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Admin check: must be a buyer (suppliers cannot access admin analytics)
    if (userRole !== "buyer") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: Admin privileges required",
        },
        { status: 403 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID not found in session" },
        { status: 400 }
      );
    }

    // ========================================
    // Step 3: Parse query parameters and build filters
    // ========================================
    const searchParams = request.nextUrl.searchParams;

    const dateRange = (searchParams.get("dateRange") as AdminAnalyticsFilters["dateRange"]) || "last_90_days";
    const buyerId = searchParams.get("buyerId") || undefined;
    const stageFilter = searchParams.get("stage") as RFPStage | undefined;
    const statusFilter = (searchParams.get("status") as "active" | "closed" | "all") || "all";

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateRange === "custom") {
      const startDateStr = searchParams.get("startDate");
      const endDateStr = searchParams.get("endDate");

      if (!startDateStr || !endDateStr) {
        return NextResponse.json(
          {
            success: false,
            error: "Custom date range requires both startDate and endDate",
          },
          { status: 400 }
        );
      }

      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid date format" },
          { status: 400 }
        );
      }
    }

    const filters: AdminAnalyticsFilters = {
      dateRange,
      startDate,
      endDate,
      buyerId,
      stageFilter,
      statusFilter,
    };

    // ========================================
    // Step 4: Build analytics dashboard
    // ========================================
    const dashboard = await buildAdminAnalyticsDashboard(companyId, filters);

    // ========================================
    // Step 5: Log activity
    // ========================================
    try {
      await logActivity({
        actorRole: ACTOR_ROLES.BUYER,
        eventType: "ADMIN_ANALYTICS_VIEWED",
        summary: `Admin analytics dashboard viewed by ${session.user.name || session.user.email}`,
        userId,
        details: {
          dateRange,
          buyerId: buyerId || null,
          stageFilter: stageFilter || null,
          statusFilter,
          chartsLoadedCount: Object.keys(dashboard.charts).length,
          kpisLoadedCount: Object.keys(dashboard.kpis).length,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin analytics activity:", logError);
      // Don't fail the request if logging fails
    }

    // ========================================
    // Step 6: Return dashboard data
    // ========================================
    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error("Error fetching admin analytics dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch admin analytics dashboard",
      },
      { status: 500 }
    );
  }
}
