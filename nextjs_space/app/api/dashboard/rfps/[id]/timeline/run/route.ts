/**
 * Timeline Tick Execution API (STEP 36)
 * 
 * Manually triggers timeline orchestration for an RFP
 * Buyer-only access with RFP ownership validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { runRfpTimelineTick } from "@/lib/timeline/timeline-engine";

/**
 * POST /api/dashboard/rfps/[id]/timeline/run
 * 
 * Executes timeline tick orchestration for an RFP
 * Optional dryRun parameter to preview actions without persisting
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth: buyer-only
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "buyer") {
      return NextResponse.json({ error: "Forbidden: Buyer access only" }, { status: 403 });
    }

    const rfpId = params.id;
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    // Validate RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not your RFP" }, { status: 403 });
    }

    // Run timeline tick
    const result = await runRfpTimelineTick(rfpId, {
      dryRun,
      triggeredByUserId: session.user.id,
    });

    // Create activity log event (if not dry run)
    if (!dryRun && result.actionsApplied.length > 0) {
      await prisma.rfpTimelineEvent.create({
        data: {
          rfpId,
          eventType: "TIMELINE_TICK_RUN",
          payload: {
            actionsApplied: result.actionsApplied,
            manual: true,
          },
          createdById: session.user.id,
        },
      });
    }

    return NextResponse.json({
      snapshot: result.snapshot,
      actionsApplied: result.actionsApplied,
      dryRun,
    });
  } catch (error: any) {
    console.error("Error in POST /api/dashboard/rfps/[id]/timeline/run:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
