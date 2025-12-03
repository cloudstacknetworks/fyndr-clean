/**
 * Timeline Config & State API (STEP 36)
 * 
 * Handles retrieval and updates of RFP timeline configuration
 * Buyer-only access with RFP ownership validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import {
  normalizeTimelineConfig,
  computeTimelineState,
  RfpTimelineConfig,
  RfpTimelineStateSnapshot,
} from "@/lib/timeline/timeline-engine";
import { guardAgainstArchivedRfp } from "@/lib/archive/archive-guards"; // STEP 47

/**
 * GET /api/dashboard/rfps/[id]/timeline
 * 
 * Retrieves timeline configuration and computed state for an RFP
 * Uses cached snapshot if < 5 minutes old, otherwise recomputes
 */
export async function GET(
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

    // Ensure RFP belongs to buyer's company
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        userId: true,
        timelineConfig: true,
        timelineStateSnapshot: true,
        askQuestionsStart: true,
        askQuestionsEnd: true,
        submissionStart: true,
        submissionEnd: true,
        demoWindowStart: true,
        demoWindowEnd: true,
        awardDate: true,
        createdAt: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not your RFP" }, { status: 403 });
    }

    // Normalize config
    const config = normalizeTimelineConfig(rfp as any);

    // Check if we should recompute state
    let state: RfpTimelineStateSnapshot;
    const existingSnapshot = rfp.timelineStateSnapshot as any;
    const shouldRecompute =
      !existingSnapshot ||
      !existingSnapshot.generatedAt ||
      new Date().getTime() - new Date(existingSnapshot.generatedAt).getTime() > 5 * 60 * 1000; // 5 minutes

    if (shouldRecompute) {
      // Recompute state
      state = computeTimelineState(rfp as any, config);

      // Update snapshot in database
      await prisma.rFP.update({
        where: { id: rfpId },
        data: {
          timelineStateSnapshot: state as any,
        },
      });
    } else {
      state = existingSnapshot as RfpTimelineStateSnapshot;
    }

    return NextResponse.json({
      config,
      state,
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/rfps/[id]/timeline:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/rfps/[id]/timeline
 * 
 * Updates timeline configuration for an RFP
 * Recomputes state and persists new config
 */
export async function PUT(
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
    const body = await req.json();

    // Validate RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not your RFP" }, { status: 403 });
    }

    // STEP 47: Prevent mutations on archived RFPs
    try {
      await guardAgainstArchivedRfp(rfpId);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Merge body into existing config (increment version)
    const currentConfig = normalizeTimelineConfig(rfp);
    const updatedConfig: RfpTimelineConfig = {
      version: currentConfig.version + 1,
      timezone: body.timezone || currentConfig.timezone,
      keyDates: {
        ...currentConfig.keyDates,
        ...(body.keyDates || {}),
      },
      automation: {
        ...currentConfig.automation,
        ...(body.automation || {}),
        reminderRules: {
          ...currentConfig.automation.reminderRules,
          ...(body.automation?.reminderRules || {}),
        },
      },
    };

    // Recompute state
    const state = computeTimelineState(rfp, updatedConfig);

    // Persist new config and state
    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        timelineConfig: updatedConfig as any,
        timelineStateSnapshot: state as any,
      },
    });

    // Create activity log event (simplified - in full implementation would use activity log system)
    await prisma.rfpTimelineEvent.create({
      data: {
        rfpId,
        eventType: "TIMELINE_CONFIG_UPDATED",
        payload: { version: updatedConfig.version },
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      config: updatedConfig,
      state,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/dashboard/rfps/[id]/timeline:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
