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
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const rfps = await prisma.rFP.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        askQuestionsStart: true,
        askQuestionsEnd: true,
        submissionStart: true,
        submissionEnd: true,
        demoWindowStart: true,
        demoWindowEnd: true,
        awardDate: true
      }
    });

    const events: any[] = [];

    rfps.forEach(rfp => {
      const addEvent = (date: Date | null, type: string) => {
        if (date && date >= now && date <= nextWeek) {
          events.push({ 
            type, 
            date: date.toISOString(), 
            rfpTitle: rfp.title,
            rfpId: rfp.id
          });
        }
      };

      addEvent(rfp.askQuestionsStart, "Q&A Opens");
      addEvent(rfp.askQuestionsEnd, "Q&A Closes");
      addEvent(rfp.submissionStart, "Submission Opens");
      addEvent(rfp.submissionEnd, "Submission Closes");
      addEvent(rfp.demoWindowStart, "Demo Window Opens");
      addEvent(rfp.demoWindowEnd, "Demo Window Closes");
      addEvent(rfp.awardDate, "Award Date");
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events: events.slice(0, 10) });
  } catch (error) {
    console.error("Timeline widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
