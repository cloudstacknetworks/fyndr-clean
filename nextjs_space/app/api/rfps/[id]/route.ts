import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

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
    const { title, description, status, dueDate, submittedAt, budget, priority, internalNotes } = body;

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

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (submittedAt !== undefined) updateData.submittedAt = submittedAt ? new Date(submittedAt) : null;
    if (budget !== undefined) {
      updateData.budget = budget !== null && budget !== "" ? parseFloat(budget) : null;
    }
    if (priority !== undefined) updateData.priority = priority || "MEDIUM";
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes?.trim() || null;

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

    return NextResponse.json(updatedRfp);
  } catch (error) {
    console.error("Error updating RFP:", error);
    return NextResponse.json(
      { error: "Failed to update RFP" },
      { status: 500 }
    );
  }
}
