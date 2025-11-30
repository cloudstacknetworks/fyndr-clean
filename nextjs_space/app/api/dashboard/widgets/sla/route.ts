import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getSlaStatus } from "@/lib/stage-sla";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rfps = await prisma.rFP.findMany({
      where: { userId },
      select: { 
        stage: true,
        enteredStageAt: true,
        stageEnteredAt: true,
        stageSlaDays: true
      }
    });

    let red = 0, yellow = 0, green = 0;

    rfps.forEach(rfp => {
      const slaStatus = getSlaStatus(rfp);
      if (slaStatus.status === 'breached') red++;
      else if (slaStatus.status === 'warning') yellow++;
      else green++;
    });

    return NextResponse.json({ red, yellow, green, total: rfps.length });
  } catch (error) {
    console.error("SLA widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
