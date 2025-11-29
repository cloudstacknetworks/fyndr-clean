import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Parse request body
    const body = await req.json();
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request: 'completed' must be a boolean" },
        { status: 400 }
      );
    }

    // Find the task and verify ownership through RFP
    const task = await prisma.stageTask.findUnique({
      where: { id: taskId },
      include: {
        rfp: {
          select: { userId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify ownership
    if (task.rfp.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this task" },
        { status: 403 }
      );
    }

    // Update task completion status
    const updatedTask = await prisma.stageTask.update({
      where: { id: taskId },
      data: {
        completed: completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update task: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the task" },
      { status: 500 }
    );
  }
}
