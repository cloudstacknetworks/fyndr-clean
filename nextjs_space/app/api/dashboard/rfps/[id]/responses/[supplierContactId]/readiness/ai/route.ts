import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; supplierContactId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden - Buyer access only" }, { status: 403 });
  }

  try {
    const response = await prisma.supplierResponse.findUnique({
      where: { supplierContactId: params.supplierContactId },
      include: {
        rfp: true,
        supplierContact: true
      }
    });

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        insights: {
          summary: "AI insights require OpenAI API key configuration.",
          topRisks: ["API key not configured"],
          mitigation: ["Configure OPENAI_API_KEY environment variable"],
          standpointAnalysis: "Unable to generate AI analysis without API key.",
          competitivePositioning: "N/A"
        }
      });
    }

    const readinessBreakdown = response.readinessBreakdown as any;
    const complianceFlags = response.complianceFlags as any;
    const missingRequirements = response.missingRequirements as any;

    const prompt = `You are an RFP evaluation expert. Analyze the following supplier readiness data and provide insights:

Supplier: ${response.supplierContact.name}
RFP: ${response.rfp.title}
Overall Readiness Score: ${response.readinessScore}%

Category Breakdown:
${JSON.stringify(readinessBreakdown, null, 2)}

Compliance Flags:
${JSON.stringify(complianceFlags, null, 2)}

Missing Requirements:
${JSON.stringify(missingRequirements, null, 2)}

Provide a JSON response with:
1. summary: 3-5 sentence explanation of overall readiness
2. topRisks: Array of 3-5 bullet points highlighting key risks
3. mitigation: Array of 3-5 mitigation steps
4. standpointAnalysis: Why the supplier is or is not ready (2-3 sentences)
5. competitivePositioning: How their readiness compares to typical suppliers (2-3 sentences)

Return ONLY valid JSON, no markdown formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content || "{}";
    const insights = JSON.parse(aiResponse);

    // Store insights in database
    await prisma.supplierResponse.update({
      where: { id: response.id },
      data: {
        readinessInsights: insights as any
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        rfpId: response.rfpId,
        userId: session.user.id,
        eventType: "READINESS_AI_GENERATED",
        description: `AI readiness insights generated for ${response.supplierContact.name}`
      }
    });

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights", details: error.message },
      { status: 500 }
    );
  }
}
