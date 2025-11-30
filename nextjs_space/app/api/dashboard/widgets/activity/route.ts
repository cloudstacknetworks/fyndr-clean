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

    // Get last 20 activity logs for user's RFPs
    const activities = await prisma.activityLog.findMany({
      where: {
        rfp: {
          userId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        eventType: true,
        summary: true,
        createdAt: true,
        rfp: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Activity widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
