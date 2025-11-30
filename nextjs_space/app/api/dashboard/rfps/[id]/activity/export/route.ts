/**
 * STEP 24: Activity Log CSV Export API (Buyer View)
 * GET /api/dashboard/rfps/[id]/activity/export
 * 
 * Exports activity logs for a specific RFP as CSV.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfpId = params.id;
    
    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { companyId: true, userId: true, title: true }
    });
    
    if (!rfp || rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all logs for this RFP
    const logs = await prisma.activityLog.findMany({
      where: { rfpId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });

    // Generate CSV
    const headers = ["Timestamp", "Event Type", "Actor", "Summary", "Details"];
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.eventType,
      log.actorRole,
      log.summary,
      JSON.stringify(log.details || {})
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Log export event
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.ACTIVITY_EXPORTED_CSV,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      userId: session.user.id,
      summary: "Activity log exported to CSV",
      details: { rfpId, exportedCount: logs.length }
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="activity-log-${rfpId}.csv"`
      }
    });
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
