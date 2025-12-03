/**
 * STEP 42: Supplier Debrief Pack API - GET JSON Data
 * Returns supplier-specific debrief data as JSON
 * 
 * SECURITY:
 * - Buyer-only access (403 for suppliers)
 * - Company-scoped (buyers can only access RFPs in their company)
 * - Requires authentication (401 for unauthenticated)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildSupplierDebriefData } from "@/lib/debrief/debrief-pack-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; supplierId: string } }
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
        { error: "Forbidden - buyers only. Suppliers cannot access debrief data." },
        { status: 403 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;

    // Load RFP for company scope validation
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
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

    // Company scope check - user must be from the same company as the RFP
    // Allow if user created the RFP OR user belongs to the same company
    const userBelongsToCompany = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        OR: [
          { userId: user.id },
          { companyId: user.id }, // If user is company admin
          {
            company: {
              rfps: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        ],
      },
    });

    if (!userBelongsToCompany) {
      return NextResponse.json(
        { error: "Access denied - company scope violation" },
        { status: 403 }
      );
    }

    // Build supplier debrief data
    const debriefData = await buildSupplierDebriefData(rfpId, supplierId);

    return NextResponse.json(
      { 
        success: true,
        data: debriefData 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating supplier debrief data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate supplier debrief data" },
      { status: 500 }
    );
  }
}
