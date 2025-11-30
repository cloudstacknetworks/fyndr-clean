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

    // Get response velocity metrics
    const contacts = await prisma.supplierContact.findMany({
      where: {
        rfp: {
          userId
        },
        invitedAt: {
          not: null
        },
        supplierResponse: {
          status: 'SUBMITTED',
          submittedAt: {
            not: null
          }
        }
      },
      select: {
        invitedAt: true,
        supplierResponse: {
          select: {
            submittedAt: true
          }
        }
      },
      take: 20
    });

    const velocityData = contacts
      .filter((c): c is typeof c & { invitedAt: Date; supplierResponse: { submittedAt: Date } } => 
        c.invitedAt !== null && c.supplierResponse?.submittedAt !== null
      )
      .map((c): number => {
        const inviteTime = c.invitedAt.getTime();
        const submitTime = c.supplierResponse.submittedAt.getTime();
        const daysToSubmit = Math.round((submitTime - inviteTime) / (1000 * 60 * 60 * 24));
        return daysToSubmit;
      });

    const avgVelocity = velocityData.length > 0
      ? Math.round(velocityData.reduce((a: number, b: number) => a + b, 0) / velocityData.length)
      : 0;

    return NextResponse.json({ 
      avgDaysToSubmit: avgVelocity,
      samples: velocityData.length
    });
  } catch (error) {
    console.error("Velocity widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
