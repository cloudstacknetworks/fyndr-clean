import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfpId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { userId: true }
    });

    if (!rfp || rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all responses for this RFP
    const responses = await prisma.supplierResponse.findMany({
      where: { rfpId },
      include: {
        supplierContact: { select: { id: true, name: true, organization: true } }
      }
    });

    // Search across structured fields
    const results = responses.map(response => {
      const matches: string[] = [];
      let relevanceScore = 0;

      const searchLower = q.toLowerCase();
      const structuredAnswers = response.structuredAnswers as any || {};

      // Search in structuredAnswers
      Object.entries(structuredAnswers).forEach(([key, value]) => {
        const valueStr = JSON.stringify(value).toLowerCase();
        if (valueStr.includes(searchLower)) {
          matches.push(`structuredAnswers.${key}`);
          relevanceScore += 1;
        }
      });

      // Search in extracted data
      const extractedData = {
        pricing: response.extractedPricing,
        requirements: response.extractedRequirementsCoverage,
        technical: response.extractedTechnicalClaims,
        risks: response.extractedRisks,
        differentiators: response.extractedDifferentiators,
        demo: response.extractedDemoSummary
      };

      Object.entries(extractedData).forEach(([key, value]) => {
        if (value && JSON.stringify(value).toLowerCase().includes(searchLower)) {
          matches.push(key);
          relevanceScore += 2;
        }
      });

      return {
        supplierContactId: response.supplierContactId,
        supplierName: response.supplierContact.name,
        organization: response.supplierContact.organization,
        matches,
        relevanceScore
      };
    }).filter(r => r.matches.length > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Response search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
