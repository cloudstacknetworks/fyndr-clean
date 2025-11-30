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

    // Get questions for user's RFPs
    const questions = await prisma.supplierQuestion.findMany({
      where: {
        rfp: {
          userId
        }
      },
      select: {
        status: true
      }
    });

    const unanswered = questions.filter(q => q.status === 'PENDING').length;
    const total = questions.length;

    return NextResponse.json({ 
      unanswered, 
      total,
      answered: total - unanswered
    });
  } catch (error) {
    console.error("Questions widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
