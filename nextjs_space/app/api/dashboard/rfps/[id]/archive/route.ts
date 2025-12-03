/**
 * STEP 47: Archive API - GET Archive Status
 * Returns current archive status and compliance pack snapshot for an RFP
 */

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

    // Authentication check
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Buyer-only check
    if (user.role !== "buyer") {
      return NextResponse.json(
        { error: "Forbidden - buyers only" },
        { status: 403 }
      );
    }

    const rfpId = params.id;

    // Company scope check
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        title: true,
        companyId: true,
        userId: true,
        isArchived: true,
        archivedAt: true,
        archivedByUserId: true,
        compliancePackSnapshot: true,
        archivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Verify user belongs to the same company
    const userRfps = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: rfp.companyId,
      },
    });

    if (!userRfps && rfp.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied - company scope violation" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        isArchived: rfp.isArchived,
        archivedAt: rfp.archivedAt,
        archivedBy: rfp.archivedBy,
        compliancePackSnapshot: rfp.compliancePackSnapshot,
      },
    });
  } catch (error: any) {
    console.error("Error fetching archive status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch archive status" },
      { status: 500 }
    );
  }
}
