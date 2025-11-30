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

    // Get supplier responses with readiness for user's RFPs
    const responses = await prisma.supplierResponse.findMany({
      where: {
        supplierContact: {
          rfp: {
            userId
          }
        },
        status: 'SUBMITTED'
      },
      select: {
        readinessIndicator: true
      }
    });

    const distribution = {
      READY: 0,
      CONDITIONAL: 0,
      NOT_READY: 0,
      UNKNOWN: 0
    };

    responses.forEach(r => {
      if (r.readinessIndicator) {
        distribution[r.readinessIndicator as keyof typeof distribution]++;
      } else {
        distribution.UNKNOWN++;
      }
    });

    return NextResponse.json({ 
      distribution,
      total: responses.length
    });
  } catch (error) {
    console.error("Readiness widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
