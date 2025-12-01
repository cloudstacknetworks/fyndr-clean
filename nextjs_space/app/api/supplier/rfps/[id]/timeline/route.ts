/**
 * Supplier Timeline API (STEP 36)
 * 
 * Read-only timeline access for suppliers
 * Filters sensitive buyer-specific information
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/supplier/rfps/[id]/timeline
 * 
 * Retrieves timeline state for suppliers (read-only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth: supplier-only
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "supplier") {
      return NextResponse.json({ error: "Forbidden: Supplier access only" }, { status: 403 });
    }

    const rfpId = params.id;

    // Ensure supplier has access to this RFP
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        rfpId,
        portalUserId: session.user.id,
      },
      select: {
        id: true,
        rfp: {
          select: {
            id: true,
            timelineStateSnapshot: true,
          },
        },
      },
    });

    if (!supplierContact) {
      return NextResponse.json(
        { error: "RFP not found or access denied" },
        { status: 404 }
      );
    }

    const state = supplierContact.rfp.timelineStateSnapshot;

    if (!state) {
      return NextResponse.json(
        { error: "Timeline not configured for this RFP" },
        { status: 404 }
      );
    }

    // Return state (already filtered to exclude sensitive data)
    return NextResponse.json({ state });
  } catch (error: any) {
    console.error("Error in GET /api/supplier/rfps/[id]/timeline:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
