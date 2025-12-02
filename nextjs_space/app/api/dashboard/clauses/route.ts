/**
 * app/api/dashboard/clauses/route.ts
 * 
 * STEP 38B: Clause Library CRUD API
 * GET /api/dashboard/clauses - List all clauses (with optional filtering)
 * POST /api/dashboard/clauses - Create a new clause
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  listClauses,
  createClause,
  listClauseCategories,
  CreateClauseInput,
} from "@/lib/rfp-templates/clause-engine";

/**
 * GET /api/dashboard/clauses
 * List all clauses, optionally filtered by category or type
 * Query params:
 * - categoryId: filter by category ID
 * - clauseType: filter by clause type (legal, commercial, security, sow, other)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId") || undefined;
    const clauseType = searchParams.get("clauseType") || undefined;

    const clauses = await listClauses(categoryId, clauseType);

    return NextResponse.json({
      clauses,
      count: clauses.length,
    });
  } catch (error: any) {
    console.error("Error fetching clauses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clauses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/clauses
 * Create a new clause in the library
 * Body: CreateClauseInput
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.categoryId || !body.title || !body.description || !body.body || !body.clauseType) {
      return NextResponse.json(
        { error: "Missing required fields: categoryId, title, description, body, clauseType" },
        { status: 400 }
      );
    }

    // Validate clauseType
    const validClauseTypes = ["legal", "commercial", "security", "sow", "other"];
    if (!validClauseTypes.includes(body.clauseType)) {
      return NextResponse.json(
        { error: `Invalid clauseType. Must be one of: ${validClauseTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const input: CreateClauseInput = {
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      body: body.body,
      isRequired: body.isRequired ?? false,
      clauseType: body.clauseType,
      order: body.order ?? 0,
    };

    const clause = await createClause(input);

    return NextResponse.json({
      clause,
      message: "Clause created successfully",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating clause:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create clause" },
      { status: 500 }
    );
  }
}
