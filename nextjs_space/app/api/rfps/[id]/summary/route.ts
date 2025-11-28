import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const rfpId = params.id;

    // Fetch complete RFP data
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        company: {
          select: { name: true },
        },
        supplier: {
          select: { name: true },
        },
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Format dates for the prompt
    const formatDate = (date: Date | null) => {
      if (!date) return "Not specified";
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(date));
    };

    const formatCurrency = (amount: number | null) => {
      if (amount === null) return "Not specified";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    // Create comprehensive prompt
    const prompt = `You are an AI assistant helping to create executive summaries for RFPs (Request for Proposals).

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description || "Not provided"}
- Company: ${rfp.company?.name || "Not specified"}
- Supplier: ${rfp.supplier?.name || "Not specified"}
- Status: ${rfp.status}
- Due Date: ${formatDate(rfp.dueDate)}
- Submitted At: ${formatDate(rfp.submittedAt)}
- Budget: ${formatCurrency(rfp.budget)}
- Priority: ${rfp.priority}
- Internal Notes: ${rfp.internalNotes || "None"}

Please provide a structured executive summary with the following sections. Be concise yet comprehensive, and format your response as valid JSON:

1. High-Level Overview: A brief 2-3 sentence summary of what this RFP is about and its current state.
2. Goals & Requirements: Key objectives and requirements outlined in the RFP.
3. Key Dates & Deadlines: Important timeline information including due dates and submission status.
4. Budget & Constraints: Financial considerations and any budgetary constraints.
5. Risks & Considerations: Potential risks, challenges, or important factors to consider.

Format your response as JSON with keys: overview, goals, dates, budget, risks. Each value should be a string with well-formatted text (you can use newlines for readability).`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that creates executive summaries for RFPs. Always respond with valid JSON in the exact format requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const summaryText = completion.choices[0]?.message?.content;
    if (!summaryText) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    const summary = JSON.parse(summaryText);

    // Validate the response structure
    if (!summary.overview || !summary.goals || !summary.dates || !summary.budget || !summary.risks) {
      return NextResponse.json(
        { error: "Invalid summary format received from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    
    // Handle OpenAI-specific errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API authentication failed. Please check your API key." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Failed to generate summary: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the summary" },
      { status: 500 }
    );
  }
}
