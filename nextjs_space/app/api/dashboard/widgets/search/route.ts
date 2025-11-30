import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get recent activity logs related to search (this is a simplified version)
    // In a real implementation, you'd track actual search queries
    const recentSearches = await prisma.activityLog.findMany({
      where: {
        rfp: {
          userId
        },
        eventType: {
          in: ['RFP_CREATED', 'SUPPLIER_INVITATION_SENT', 'SUPPLIER_RESPONSE_SUBMITTED']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        eventType: true,
        summary: true,
        createdAt: true
      }
    });

    return NextResponse.json({ 
      recentSearches,
      searchEnabled: true
    });
  } catch (error) {
    console.error("Search widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
