/**
 * app/api/dashboard/clauses/[id]/route.ts
 * 
 * STEP 38B: Individual Clause CRUD API
 * GET /api/dashboard/clauses/[id] - Get a specific clause
 * PUT /api/dashboard/clauses/[id] - Update a clause
 * DELETE /api/dashboard/clauses/[id] - Delete a clause
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getClauseById,
  updateClause,
  deleteClause,
  UpdateClauseInput,
} from "@/lib/rfp-templates/clause-engine";

/**
 * GET /api/dashboard/clauses/[id]
 * Get a specific clause by ID
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

    const clause = await getClauseById(params.id);

    if (!clause) {
      return NextResponse.json({ error: "Clause not found" }, { status: 404 });
    }

    return NextResponse.json({ clause });
  } catch (error: any) {
    console.error("Error fetching clause:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clause" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/clauses/[id]
 * Update a clause
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate clauseType if provided
    if (body.clauseType) {
      const validClauseTypes = ["legal", "commercial", "security", "sow", "other"];
      if (!validClauseTypes.includes(body.clauseType)) {
        return NextResponse.json(
          { error: `Invalid clauseType. Must be one of: ${validClauseTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const input: UpdateClauseInput = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.isRequired !== undefined && { isRequired: body.isRequired }),
      ...(body.clauseType !== undefined && { clauseType: body.clauseType }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
    };

    const clause = await updateClause(params.id, input);

    return NextResponse.json({
      clause,
      message: "Clause updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating clause:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update clause" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/clauses/[id]
 * Delete a clause from the library
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteClause(params.id);

    return NextResponse.json({
      message: "Clause deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting clause:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete clause" },
      { status: 500 }
    );
  }
}
