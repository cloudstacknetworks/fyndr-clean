/**
 * STEP 24: Global Activity Log API (Buyer View)
 * GET /api/dashboard/activity
 * 
 * Fetches activity logs for all RFPs owned by the buyer with filtering and pagination.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const rfpId = searchParams.get("rfpId") || undefined;
    const eventType = searchParams.get("eventType") || undefined;
    const actorRole = searchParams.get("actorRole") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    // Build where clause - only RFPs owned by buyer
    const where: any = {
      rfp: { userId: session.user.id }
    };
    if (rfpId) where.rfpId = rfpId;
    if (eventType) where.eventType = eventType;
    if (actorRole) where.actorRole = actorRole;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Fetch logs with pagination
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          rfp: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.activityLog.count({ where })
    ]);

    return NextResponse.json({ items, page, pageSize, total });
  } catch (error) {
    console.error("Error fetching global activity logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
