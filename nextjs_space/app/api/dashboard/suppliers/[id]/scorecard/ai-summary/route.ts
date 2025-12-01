import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { calculateSupplierKPIs, calculateSupplierBenchmarks } from "@/lib/scorecard-utils";
import OpenAI from "openai";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kpis = await calculateSupplierKPIs(params.id);
    const benchmarks = await calculateSupplierBenchmarks(params.id);

    // Try to generate AI summary if OpenAI is configured
    let summary = "";
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const prompt = `Generate a professional supplier performance summary (3-4 sentences) based on:
- Win rate: ${kpis.participation.winRate.toFixed(1)}%
- Avg readiness: ${kpis.readiness.avgReadiness.toFixed(1)}
- Pricing competitiveness: ${kpis.pricing.competitivenessIndex.toFixed(1)}
- Avg submission speed: ${kpis.speed.avgSubmissionSpeedDays.toFixed(1)} days
- Reliability index: ${kpis.reliabilityIndex.toFixed(1)}
- Score vs peers: ${benchmarks.scoreComparison.difference > 0 ? "above" : "below"} average by ${Math.abs(benchmarks.scoreComparison.difference).toFixed(1)} points

Focus on strengths, weaknesses, and negotiation strategies.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.7
        });

        summary = completion.choices[0]?.message?.content || "";
      } catch (aiError) {
        console.error("AI summary generation error:", aiError);
        summary = "AI summary unavailable. Please configure OPENAI_API_KEY.";
      }
    } else {
      summary = "AI summary unavailable. Please configure OPENAI_API_KEY.";
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI summary error:", error);
    return NextResponse.json({ 
      summary: "AI summary unavailable. Please try again later." 
    }, { status: 200 });
  }
}
