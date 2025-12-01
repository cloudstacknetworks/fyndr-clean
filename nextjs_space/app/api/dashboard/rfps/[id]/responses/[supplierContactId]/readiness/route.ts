import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
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
        supplierContact: true
      }
    });

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    return NextResponse.json({
      readinessScore: response.readinessScore,
      readinessBreakdown: response.readinessBreakdown,
      complianceFlags: response.complianceFlags,
      missingRequirements: response.missingRequirements,
      readinessInsights: response.readinessInsights,
      supplierName: response.supplierContact.name
    });
  } catch (error: any) {
    console.error("Readiness fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch readiness data", details: error.message },
      { status: 500 }
    );
  }
}
