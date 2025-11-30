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

    // Count RFPs by stage
    const rfps = await prisma.rFP.findMany({
      where: { userId },
      select: { stage: true }
    });

    const stageCounts: Record<string, number> = {
      INTAKE: 0,
      QUALIFICATION: 0,
      DISCOVERY: 0,
      DRAFTING: 0,
      PRICING_LEGAL_REVIEW: 0,
      EXEC_REVIEW: 0,
      SUBMISSION: 0,
      DEBRIEF: 0,
      ARCHIVED: 0
    };

    rfps.forEach(rfp => {
      stageCounts[rfp.stage]++;
    });

    return NextResponse.json({
      total: rfps.length,
      stages: stageCounts
    });
  } catch (error) {
    console.error("Pipeline widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
