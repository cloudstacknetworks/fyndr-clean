import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Gather dashboard metrics
    const activeRFPs = await prisma.rFP.count({
      where: { 
        userId, 
        status: { in: ['DRAFT', 'PUBLISHED'] } 
      }
    });

    const pendingQuestions = await prisma.supplierQuestion.count({
      where: {
        rfp: { userId },
        status: 'PENDING'
      }
    });

    const upcomingDeadlines = await prisma.rFP.count({
      where: {
        userId,
        submissionEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Try to generate AI summary if OpenAI is configured
    let summary = "";
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const prompt = `Generate a brief 3-sentence executive summary for an RFP dashboard with:
- ${activeRFPs} active RFPs
- ${pendingQuestions} unanswered supplier questions
- ${upcomingDeadlines} RFPs with submission deadlines in the next 7 days

Focus on actionable insights and priorities. Be concise and professional.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150
        });

        summary = completion.choices[0]?.message?.content || "";
      } catch (aiError) {
        console.error("AI summary generation failed:", aiError);
        // Fallback to basic summary
        summary = `You have ${activeRFPs} active RFPs in your pipeline. There are ${pendingQuestions} pending supplier questions requiring attention. ${upcomingDeadlines} RFP${upcomingDeadlines !== 1 ? 's have' : ' has'} upcoming submission deadlines in the next week.`;
      }
    } else {
      summary = `You have ${activeRFPs} active RFPs in your pipeline. There are ${pendingQuestions} pending supplier questions requiring attention. ${upcomingDeadlines} RFP${upcomingDeadlines !== 1 ? 's have' : ' has'} upcoming submission deadlines in the next week.`;
    }

    return NextResponse.json({ 
      summary,
      metrics: {
        activeRFPs,
        pendingQuestions,
        upcomingDeadlines
      }
    });
  } catch (error) {
    console.error("AI Summary widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
