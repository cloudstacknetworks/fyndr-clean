/**
 * STEP 24: Per-RFP Activity Log API (Buyer View)
 * GET /api/dashboard/rfps/[id]/activity
 * 
 * Fetches activity logs for a specific RFP with filtering and pagination.
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
    
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfpId = params.id;
    
    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { companyId: true, userId: true }
    });
    
    if (!rfp || rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const eventType = searchParams.get("eventType") || undefined;
    const actorRole = searchParams.get("actorRole") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const keyword = searchParams.get("keyword") || undefined;

    // Build where clause
    const where: any = { rfpId };
    if (eventType) where.eventType = eventType;
    if (actorRole) where.actorRole = actorRole;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (keyword && keyword.trim().length >= 2) {
      where.summary = { contains: keyword, mode: "insensitive" };
    }

    // Fetch logs with pagination
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { 
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.activityLog.count({ where })
    ]);

    return NextResponse.json({ items, page, pageSize, total });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
