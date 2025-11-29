import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { getStageTemplates, RFPStage } from "@/lib/stage-task-templates";
import { STAGE_LABELS } from "@/lib/stages";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfpId = params.id;

    // Fetch RFP and verify ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId, userId: session.user.id },
      include: {
        company: {
          select: { name: true },
        },
        supplier: {
          select: { name: true },
        },
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Get current stage
    const currentStage = rfp.stage as RFPStage;

    // Load template tasks for this stage
    const templateTasks = getStageTemplates(currentStage);

    // Load existing StageTask rows for this RFP and stage
    const existingTasks = await prisma.stageTask.findMany({
      where: { rfpId: rfpId, stage: currentStage },
      orderBy: { createdAt: 'asc' },
    });

    // Build a set of normalized existing task titles for deduplication
    const existingTitles = new Set<string>(
      existingTasks.map(task => task.title.toLowerCase().trim())
    );

    // Prepare list of new tasks to create
    const newTasksToCreate: Array<{ rfpId: string; stage: RFPStage; title: string; completed: boolean }> = [];

    // Add template tasks if they don't exist
    templateTasks.forEach(title => {
      const normalizedTitle = title.toLowerCase().trim();
      if (!existingTitles.has(normalizedTitle)) {
        newTasksToCreate.push({
          rfpId: rfpId,
          stage: currentStage,
          title: title,
          completed: false,
        });
        existingTitles.add(normalizedTitle); // Add to set to avoid duplicates within this batch
      }
    });

    // Try to generate AI tasks if OpenAI key is available
    let aiTasks: string[] = [];
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Format dates and currency for the prompt
        const formatDate = (date: Date | null) => {
          if (!date) return "Not specified";
          return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(date));
        };

        const formatCurrency = (amount: number | null) => {
          if (amount === null) return "Not specified";
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(amount);
        };

        // Get stage label for better context
        const stageLabel = STAGE_LABELS[currentStage] || currentStage;

        // Create prompt for AI task generation
        const prompt = `You are an AI assistant helping to generate actionable tasks for an RFP (Request for Proposal) that is currently in the "${stageLabel}" stage.

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description || "Not provided"}
- Company: ${rfp.company?.name || "Not specified"}
- Supplier: ${rfp.supplier?.name || "Not specified"}
- Current Stage: ${stageLabel}
- Due Date: ${formatDate(rfp.dueDate)}
- Budget: ${formatCurrency(rfp.budget)}
- Priority: ${rfp.priority}
- Internal Notes: ${rfp.internalNotes || "None"}

Based on this RFP's specific context and current stage, generate 3-7 short, actionable tasks that would be valuable for this stage. 

Important guidelines:
- Tasks should be specific to THIS RFP's context (company, supplier, requirements, etc.)
- Avoid generic tasks that would apply to any RFP
- Keep task titles concise (max 120 characters each)
- Focus on tasks relevant to the "${stageLabel}" stage
- Make tasks actionable (use verbs like "Review", "Confirm", "Prepare", "Schedule", etc.)

Respond with a JSON object containing a single "tasks" array of strings. Example format:
{
  "tasks": [
    "Review company's technical requirements for cloud infrastructure",
    "Confirm supplier's capacity for proposed timeline",
    "Prepare response to security compliance questions"
  ]
}`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that generates specific, actionable tasks for RFP management. Always respond with valid JSON in the exact format requested.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8,
          max_tokens: 500,
        });

        // Parse AI response
        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed.tasks)) {
            aiTasks = parsed.tasks.filter((task: any) => typeof task === 'string' && task.length > 0);
          }
        }
      } catch (error) {
        console.error("Error generating AI tasks:", error);
        // Continue with template tasks only - don't fail the entire request
      }
    }

    // Add AI-generated tasks if they don't exist
    aiTasks.forEach(title => {
      const normalizedTitle = title.toLowerCase().trim();
      if (!existingTitles.has(normalizedTitle)) {
        newTasksToCreate.push({
          rfpId: rfpId,
          stage: currentStage,
          title: title,
          completed: false,
        });
        existingTitles.add(normalizedTitle);
      }
    });

    // Create new tasks in the database
    if (newTasksToCreate.length > 0) {
      await prisma.stageTask.createMany({
        data: newTasksToCreate,
      });
    }

    // Fetch all tasks for this RFP and stage (including newly created ones)
    const allTasks = await prisma.stageTask.findMany({
      where: { rfpId: rfpId, stage: currentStage },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ 
      tasks: allTasks,
      message: `Generated ${newTasksToCreate.length} new tasks (${aiTasks.length} from AI, ${newTasksToCreate.length - aiTasks.length} from templates)`,
    });
  } catch (error) {
    console.error("Error generating tasks:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate tasks: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while generating tasks" },
      { status: 500 }
    );
  }
}
