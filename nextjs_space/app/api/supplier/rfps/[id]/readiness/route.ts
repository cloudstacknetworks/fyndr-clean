import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "supplier") {
    return NextResponse.json({ error: "Forbidden - Supplier access only" }, { status: 403 });
  }

  try {
    const response = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: params.id,
        supplierContact: { userId: session.user.id }
      }
    });

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Supplier sees limited data (no competitive positioning)
    const insights = response.readinessInsights as any;
    const supplierInsights = insights ? {
      summary: insights.summary,
      topRisks: insights.topRisks,
      mitigation: insights.mitigation,
      standpointAnalysis: insights.standpointAnalysis
      // Exclude competitivePositioning
    } : null;

    return NextResponse.json({
      readinessScore: response.readinessScore,
      readinessBreakdown: response.readinessBreakdown,
      complianceFlags: response.complianceFlags,
      missingRequirements: response.missingRequirements,
      readinessInsights: supplierInsights
    });
  } catch (error: any) {
    console.error("Supplier readiness fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch readiness data", details: error.message },
      { status: 500 }
    );
  }
}
