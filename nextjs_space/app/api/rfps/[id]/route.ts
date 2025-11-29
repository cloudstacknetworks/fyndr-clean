import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { validateStageTransition } from "@/lib/stage-transition-rules";
import { runStageAutomations } from "@/lib/stage-automation";
import { getSlaForStage } from "@/lib/stage-sla";

const prisma = new PrismaClient();

// GET /api/rfps/[id] - Fetch a single RFP by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rfp = await prisma.rFP.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
            description: true,
          },
        },
        supplier: {
          select: {
            name: true,
            contactEmail: true,
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

    return NextResponse.json(rfp);
  } catch (error) {
    console.error("Error fetching RFP:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFP" },
      { status: 500 }
    );
  }
}

// PUT /api/rfps/[id] - Update an RFP
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, status, stage, dueDate, submittedAt, budget, priority, internalNotes, override, overrideReason } = body;

    // Validate required fields
    if (title !== undefined && (!title || title.trim() === "")) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ["draft", "published", "completed"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Validate stage if provided
    const validStages = [
      'INTAKE',
      'QUALIFICATION',
      'DISCOVERY',
      'DRAFTING',
      'PRICING_LEGAL_REVIEW',
      'EXEC_REVIEW',
      'SUBMISSION',
      'DEBRIEF',
      'ARCHIVED'
    ];
    if (stage !== undefined && !validStages.includes(stage)) {
      return NextResponse.json(
        { error: "Invalid stage value" },
        { status: 400 }
      );
    }

    // Validate budget if provided
    if (budget !== undefined && budget !== null && budget !== "") {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return NextResponse.json(
          { error: "Budget must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Validate priority if provided
    if (priority !== undefined && priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return NextResponse.json(
        { error: "Priority must be one of: LOW, MEDIUM, HIGH" },
        { status: 400 }
      );
    }

    // Check if RFP exists
    const existingRfp = await prisma.rFP.findUnique({
      where: { id: params.id },
    });

    if (!existingRfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      );
    }

    // Detect stage change and validate transition
    const stageChanged = stage !== undefined && stage !== existingRfp.stage;
    
    if (stageChanged) {
      // Run validation
      const validationResult = await validateStageTransition(
        existingRfp.stage,
        stage,
        params.id
      );

      // If validation fails and no override, return 409 with validation details
      if (!validationResult.allowed && !override) {
        return NextResponse.json(
          {
            error: 'Stage transition validation failed',
            validation: validationResult
          },
          { status: 409 }
        );
      }

      // Create StageHistory entry with override reason if applicable
      await prisma.stageHistory.create({
        data: {
          rfpId: params.id,
          oldStage: existingRfp.stage,
          newStage: stage,
          changedBy: session.user.id,
          overrideReason: override ? (overrideReason || "User override") : null
        }
      });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (stage !== undefined) updateData.stage = stage;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (submittedAt !== undefined) updateData.submittedAt = submittedAt ? new Date(submittedAt) : null;
    if (budget !== undefined) {
      updateData.budget = budget !== null && budget !== "" ? parseFloat(budget) : null;
    }
    if (priority !== undefined) updateData.priority = priority || "MEDIUM";
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes?.trim() || null;
    
    // Update SLA fields when stage changes
    if (stageChanged) {
      const now = new Date();
      updateData.stageEnteredAt = now; // Keep for backward compatibility
      updateData.enteredStageAt = now; // Primary field for SLA tracking
      updateData.stageSlaDays = getSlaForStage(stage);
    }

    // Update the RFP
    const updatedRfp = await prisma.rFP.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    // Run stage automations AFTER update
    if (stageChanged) {
      await runStageAutomations({
        rfpId: params.id,
        newStage: stage
      });
    }

    return NextResponse.json(updatedRfp);
  } catch (error) {
    console.error("Error updating RFP:", error);
    return NextResponse.json(
      { error: "Failed to update RFP" },
      { status: 500 }
    );
  }
}
