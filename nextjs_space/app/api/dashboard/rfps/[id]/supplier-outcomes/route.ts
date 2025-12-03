/**
 * STEP 43: Supplier Outcome Dashboard - JSON API
 * 
 * GET /api/dashboard/rfps/[id]/supplier-outcomes
 * Returns SupplierOutcomeDashboard JSON with full supplier performance data
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildSupplierOutcomeDashboard } from "@/lib/supplier-outcome/supplier-outcome-engine";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Buyer-only access (403 for suppliers)
    if (session.user.role !== "buyer") {
      return NextResponse.json(
        { error: "Forbidden: Supplier Outcome Dashboard is buyer-only" },
        { status: 403 }
      );
    }

    // 3. Extract RFP ID
    const rfpId = context.params.id;
    const userId = session.user.id;

    // 4. Build dashboard (includes RFP ownership check)
    const dashboard = await buildSupplierOutcomeDashboard(rfpId, userId);

    // 5. Log activity: SUPPLIER_OUTCOMES_VIEWED
    await logActivityWithRequest(req, {
      userId,
      eventType: EVENT_TYPES.SUPPLIER_OUTCOMES_VIEWED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      summary: `Viewed supplier outcome dashboard for "${dashboard.rfpTitle}"`,
      details: {
        rfpId,
        rfpTitle: dashboard.rfpTitle,
        totalSuppliers: dashboard.highLevel.totalSuppliers,
        awardedSuppliers: dashboard.highLevel.totalAwarded,
      },
    });

    // 6. Return JSON
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    console.error("[Supplier Outcomes API] Error:", error);
    
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to load supplier outcomes dashboard" },
      { status: 500 }
    );
  }
}
