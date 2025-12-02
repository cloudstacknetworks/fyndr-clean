/**
 * STEP 41: Award API - GET Award Status
 * Returns current award status and snapshot for an RFP
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAwardStatus } from "@/lib/award/award-service";
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
        companyId: true,
        userId: true,
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

    // Get award status
    const awardStatus = await getAwardStatus(rfpId);

    return NextResponse.json({
      success: true,
      data: awardStatus,
    });
  } catch (error: any) {
    console.error("Error fetching award status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch award status" },
      { status: 500 }
    );
  }
}
