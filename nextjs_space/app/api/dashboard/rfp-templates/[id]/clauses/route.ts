/**
 * app/api/dashboard/rfp-templates/[id]/clauses/route.ts
 * 
 * STEP 38B: Template-Clause Linking API
 * GET /api/dashboard/rfp-templates/[id]/clauses - Get all clauses linked to a template
 * POST /api/dashboard/rfp-templates/[id]/clauses - Link or unlink clauses from a template
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getTemplateClauses,
  linkClauseToTemplate,
  unlinkClauseFromTemplate,
} from "@/lib/rfp-templates/clause-engine";

/**
 * GET /api/dashboard/rfp-templates/[id]/clauses
 * Get all clauses linked to this template
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

    const clauseLinks = await getTemplateClauses(params.id);

    return NextResponse.json({
      clauseLinks,
      count: clauseLinks.length,
    });
  } catch (error: any) {
    console.error("Error fetching template clauses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch template clauses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/rfp-templates/[id]/clauses
 * Link or unlink clauses from the template
 * 
 * Body:
 * {
 *   action: "link" | "unlink"
 *   clauseId: string (for single operations)
 *   clauseIds: string[] (for batch operations)
 *   required?: boolean (for link action)
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
    const { action, clauseId, clauseIds, required } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    // Determine which clauses to process
    const clausesToProcess: string[] = [];
    if (clauseId) {
      clausesToProcess.push(clauseId);
    }
    if (clauseIds && Array.isArray(clauseIds)) {
      clausesToProcess.push(...clauseIds);
    }

    if (clausesToProcess.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: clauseId or clauseIds" },
        { status: 400 }
      );
    }

    // Handle link/unlink actions
    switch (action) {
      case "link":
        const linkResults = [];
        for (const cId of clausesToProcess) {
          try {
            const link = await linkClauseToTemplate(
              params.id,
              cId,
              required ?? false,
              userId
            );
            linkResults.push({ clauseId: cId, success: true, link });
          } catch (err: any) {
            linkResults.push({ clauseId: cId, success: false, error: err.message });
          }
        }

        const successCount = linkResults.filter(r => r.success).length;
        return NextResponse.json({
          results: linkResults,
          message: `Successfully linked ${successCount}/${clausesToProcess.length} clause(s)`,
        });

      case "unlink":
        const unlinkResults = [];
        for (const cId of clausesToProcess) {
          try {
            await unlinkClauseFromTemplate(params.id, cId);
            unlinkResults.push({ clauseId: cId, success: true });
          } catch (err: any) {
            unlinkResults.push({ clauseId: cId, success: false, error: err.message });
          }
        }

        const unlinkSuccessCount = unlinkResults.filter(r => r.success).length;
        return NextResponse.json({
          results: unlinkResults,
          message: `Successfully unlinked ${unlinkSuccessCount}/${clausesToProcess.length} clause(s)`,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error performing clause link operation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform clause link operation" },
      { status: 500 }
    );
  }
}
