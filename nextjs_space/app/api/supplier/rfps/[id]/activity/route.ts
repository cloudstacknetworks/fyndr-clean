/**
 * STEP 24: Supplier Activity Log API (Supplier View)
 * GET /api/supplier/rfps/[id]/activity
 * 
 * Fetches activity logs for a specific RFP, filtered for supplier view (no internal logs).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "supplier") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfpId = params.id;
    
    // Verify supplier access
    const supplierContact = await prisma.supplierContact.findFirst({
      where: { rfpId, portalUserId: session.user.id }
    });
    
    if (!supplierContact) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch logs - filtered for supplier view
    const logs = await prisma.activityLog.findMany({
      where: {
        rfpId,
        OR: [
          { supplierContactId: supplierContact.id }, // Own events
          { eventType: "SUPPLIER_BROADCAST_CREATED" }, // Broadcasts
          {
            AND: [
              { eventType: "SUPPLIER_QUESTION_ANSWERED" },
              { supplierContactId: supplierContact.id }
            ]
          } // Own Q&A
        ],
        NOT: {
          eventType: {
            in: [
              "AI_EXTRACTION_RUN",
              "SUPPLIER_COMPARISON_RUN",
              "COMPARISON_AI_SUMMARY_RUN",
              "COMPARISON_NARRATIVE_GENERATED",
              "COMPARISON_REPORT_GENERATED",
              "READINESS_RECALCULATED",
              "RFP_CREATED",
              "RFP_UPDATED",
              "RFP_TIMELINE_UPDATED"
            ]
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({ items: logs });
  } catch (error) {
    console.error("Error fetching supplier activity logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
