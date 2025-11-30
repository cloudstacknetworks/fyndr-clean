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
    const now = new Date();

    // Get RFPs with submission deadlines
    const rfps = await prisma.rFP.findMany({
      where: { 
        userId,
        submissionEnd: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        submissionEnd: true
      },
      orderBy: {
        submissionEnd: 'asc'
      },
      take: 10
    });

    const deadlines = rfps.map(rfp => ({
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      deadline: rfp.submissionEnd?.toISOString(),
      daysUntil: rfp.submissionEnd 
        ? Math.ceil((rfp.submissionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null
    }));

    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error("Submissions widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
