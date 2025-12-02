/**
 * app/api/dashboard/rfp-templates/[id]/structure/route.ts
 * 
 * STEP 38B: Template Structure Editing API
 * GET /api/dashboard/rfp-templates/[id]/structure - Get template structure
 * POST /api/dashboard/rfp-templates/[id]/structure - Update template structure
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getTemplateStructure,
  saveTemplateStructure,
  addSection,
  updateSection,
  deleteSection,
  addSubsection,
  updateSubsection,
  deleteSubsection,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  updateTemplateMetadata,
  lockTemplate,
  unlockTemplate,
  createTemplateVersion,
} from "@/lib/rfp-templates/template-editor";

/**
 * GET /api/dashboard/rfp-templates/[id]/structure
 * Get the editable structure of a template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const structure = await getTemplateStructure(params.id);

    return NextResponse.json({ structure });
  } catch (error: any) {
    console.error("Error fetching template structure:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch template structure" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/rfp-templates/[id]/structure
 * Perform various structure editing operations based on the action type
 * 
 * Body:
 * {
 *   action: "save" | "addSection" | "updateSection" | "deleteSection" | 
 *           "addSubsection" | "updateSubsection" | "deleteSubsection" |
 *           "addQuestion" | "updateQuestion" | "deleteQuestion" |
 *           "updateMetadata" | "lock" | "unlock" | "createVersion"
 *   ... action-specific parameters
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case "save":
        if (!body.structure) {
          return NextResponse.json(
            { error: "Missing required field: structure" },
            { status: 400 }
          );
        }
        await saveTemplateStructure(params.id, body.structure, userId);
        return NextResponse.json({ message: "Template structure saved successfully" });

      case "addSection":
        if (!body.title) {
          return NextResponse.json(
            { error: "Missing required field: title" },
            { status: 400 }
          );
        }
        const newSection = await addSection(
          params.id,
          body.title,
          body.description,
          userId,
          body.order
        );
        return NextResponse.json({
          section: newSection,
          message: "Section added successfully",
        });

      case "updateSection":
        if (!body.sectionId) {
          return NextResponse.json(
            { error: "Missing required field: sectionId" },
            { status: 400 }
          );
        }
        await updateSection(params.id, body.sectionId, body.updates || {}, userId);
        return NextResponse.json({ message: "Section updated successfully" });

      case "deleteSection":
        if (!body.sectionId) {
          return NextResponse.json(
            { error: "Missing required field: sectionId" },
            { status: 400 }
          );
        }
        await deleteSection(params.id, body.sectionId, userId);
        return NextResponse.json({ message: "Section deleted successfully" });

      case "addSubsection":
        if (!body.sectionId || !body.title) {
          return NextResponse.json(
            { error: "Missing required fields: sectionId, title" },
            { status: 400 }
          );
        }
        const newSubsection = await addSubsection(
          params.id,
          body.sectionId,
          body.title,
          userId,
          body.order
        );
        return NextResponse.json({
          subsection: newSubsection,
          message: "Subsection added successfully",
        });

      case "updateSubsection":
        if (!body.sectionId || !body.subsectionId) {
          return NextResponse.json(
            { error: "Missing required fields: sectionId, subsectionId" },
            { status: 400 }
          );
        }
        await updateSubsection(
          params.id,
          body.sectionId,
          body.subsectionId,
          body.updates || {},
          userId
        );
        return NextResponse.json({ message: "Subsection updated successfully" });

      case "deleteSubsection":
        if (!body.sectionId || !body.subsectionId) {
          return NextResponse.json(
            { error: "Missing required fields: sectionId, subsectionId" },
            { status: 400 }
          );
        }
        await deleteSubsection(params.id, body.sectionId, body.subsectionId, userId);
        return NextResponse.json({ message: "Subsection deleted successfully" });

      case "addQuestion":
        if (!body.sectionId || !body.subsectionId || !body.question) {
          return NextResponse.json(
            { error: "Missing required fields: sectionId, subsectionId, question" },
            { status: 400 }
          );
        }
        const newQuestion = await addQuestion(
          params.id,
          body.sectionId,
          body.subsectionId,
          body.question,
          userId,
          body.order
        );
        return NextResponse.json({
          question: newQuestion,
          message: "Question added successfully",
        });

      case "updateQuestion":
        if (!body.sectionId || !body.subsectionId || !body.questionId) {
          return NextResponse.json(
            { error: "Missing required fields: sectionId, subsectionId, questionId" },
            { status: 400 }
          );
        }
        await updateQuestion(
          params.id,
          body.sectionId,
          body.subsectionId,
          body.questionId,
          body.updates || {},
          userId
        );
        return NextResponse.json({ message: "Question updated successfully" });

      case "deleteQuestion":
        if (!body.sectionId || !body.subsectionId || !body.questionId) {
          return NextResponse.json(
            { error: "Missing required fields: sectionId, subsectionId, questionId" },
            { status: 400 }
          );
        }
        await deleteQuestion(
          params.id,
          body.sectionId,
          body.subsectionId,
          body.questionId,
          userId
        );
        return NextResponse.json({ message: "Question deleted successfully" });

      case "updateMetadata":
        await updateTemplateMetadata(params.id, body.updates || {}, userId);
        return NextResponse.json({ message: "Template metadata updated successfully" });

      case "lock":
        await lockTemplate(params.id);
        return NextResponse.json({ message: "Template locked successfully" });

      case "unlock":
        await unlockTemplate(params.id);
        return NextResponse.json({ message: "Template unlocked successfully" });

      case "createVersion":
        const newTemplateId = await createTemplateVersion(params.id, userId);
        return NextResponse.json({
          newTemplateId,
          message: "New template version created successfully",
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error performing template structure operation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform template structure operation" },
      { status: 500 }
    );
  }
}
