import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

/**
 * POST /api/dashboard/rfps/[id]/executive-summaries/generate
 * 
 * Generate executive summary content using AI.
 * 
 * Supports 3 modes:
 * 1. "new" - Creates a new summary document
 * 2. "replace_content" - Replaces content of existing summary (keeps same version)
 * 3. "new_version_from_existing" - Creates new version based on existing summary
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Authorization: Supplier role check
    if (session.user.role === "SUPPLIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rfpId } = params;
    const body = await request.json();
    const { 
      audience, 
      tone, 
      title,
      mode = "new",
      summaryId 
    } = body;

    // Validate required fields
    if (!audience || !tone) {
      return NextResponse.json(
        { error: "Missing required fields: audience and tone are required" },
        { status: 400 }
      );
    }

    // Validate mode
    const validModes = ["new", "replace_content", "new_version_from_existing"];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
        { status: 400 }
      );
    }

    // For replace_content and new_version_from_existing modes, summaryId is required
    if ((mode === "replace_content" || mode === "new_version_from_existing") && !summaryId) {
      return NextResponse.json(
        { error: `summaryId is required for mode: ${mode}` },
        { status: 400 }
      );
    }

    // Verify RFP exists and belongs to user
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        userId: session.user.id
      }
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // If summaryId provided, verify it exists and belongs to this RFP
    let existingSummary = null;
    if (summaryId) {
      existingSummary = await prisma.executiveSummaryDocument.findFirst({
        where: {
          id: summaryId,
          rfpId: rfpId
        }
      });

      if (!existingSummary) {
        return NextResponse.json({ error: "Summary not found" }, { status: 404 });
      }
    }

    // Generate AI content
    const aiGeneratedContent = await generateExecutiveSummaryContent(
      rfp,
      audience,
      tone,
      existingSummary?.content
    );

    let summary;
    let eventType = EVENT_TYPES.EXECUTIVE_SUMMARY_GENERATED;
    let activitySummary = "";

    // Mode: new - Create new summary
    if (mode === "new") {
      // Get max version for this audience
      const maxVersion = await prisma.executiveSummaryDocument.findFirst({
        where: {
          rfpId: rfpId,
          audience: audience
        },
        orderBy: {
          version: 'desc'
        },
        select: {
          version: true
        }
      });

      const newVersion = (maxVersion?.version || 0) + 1;

      summary = await prisma.executiveSummaryDocument.create({
        data: {
          rfpId: rfpId,
          title: title || `Executive Summary for ${audience}`,
          audience: audience,
          tone: tone,
          content: aiGeneratedContent,
          version: newVersion,
          isOfficial: false,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      eventType = EVENT_TYPES.EXECUTIVE_SUMMARY_GENERATED;
      activitySummary = `Created new executive summary (v${newVersion}) for ${audience}`;
    }
    // Mode: replace_content - Update existing summary content
    else if (mode === "replace_content") {
      summary = await prisma.executiveSummaryDocument.update({
        where: {
          id: summaryId
        },
        data: {
          content: aiGeneratedContent,
          tone: tone, // Update tone if changed
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      eventType = EVENT_TYPES.EXECUTIVE_SUMMARY_EDITED;
      activitySummary = `Regenerated content for version ${existingSummary?.version}`;
    }
    // Mode: new_version_from_existing - Create new version from existing
    else if (mode === "new_version_from_existing") {
      // Get max version for this audience
      const maxVersion = await prisma.executiveSummaryDocument.findFirst({
        where: {
          rfpId: rfpId,
          audience: audience
        },
        orderBy: {
          version: 'desc'
        },
        select: {
          version: true
        }
      });

      const newVersion = (maxVersion?.version || 0) + 1;

      summary = await prisma.executiveSummaryDocument.create({
        data: {
          rfpId: rfpId,
          title: existingSummary?.title || `Executive Summary for ${audience}`,
          audience: audience,
          tone: tone,
          content: aiGeneratedContent,
          version: newVersion,
          isOfficial: false,
          authorId: session.user.id,
          clonedFromId: summaryId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      eventType = EVENT_TYPES.EXECUTIVE_SUMMARY_GENERATED;
      activitySummary = `Created version ${newVersion} from version ${existingSummary?.version}`;
    }

    // Log activity
    await logActivityWithRequest(request, {
      eventType: eventType,
      actorRole: ACTOR_ROLES.BUYER,
      userId: session.user.id,
      rfpId: rfpId,
      summary: activitySummary,
      details: {
        summaryId: summary!.id,
        audience: audience,
        tone: tone,
        mode: mode,
        version: summary!.version,
        sourceSummaryId: summaryId || null
      }
    });

    return NextResponse.json({
      summary: {
        id: summary!.id,
        title: summary!.title,
        audience: summary!.audience,
        tone: summary!.tone,
        version: summary!.version,
        isOfficial: summary!.isOfficial,
        content: summary!.content,
        createdAt: summary!.createdAt,
        updatedAt: summary!.updatedAt,
        author: summary!.author
      }
    });

  } catch (error) {
    console.error('[Generate Executive Summary Error]', error);
    return NextResponse.json(
      { error: "Failed to generate executive summary" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate executive summary content using AI
 */
async function generateExecutiveSummaryContent(
  rfp: any,
  audience: string,
  tone: string,
  existingContent?: string | null
): Promise<string> {
  // In a real implementation, this would call an AI service
  // For now, return a realistic mock response
  
  const audienceContext = {
    "C-LEVEL": "high-level strategic perspective focusing on business value and ROI",
    "BOARD_OF_DIRECTORS": "governance and fiduciary responsibility focus with risk assessment",
    "PROCUREMENT_TEAM": "detailed implementation specifics and vendor capabilities",
    "TECHNICAL_TEAM": "technical architecture and integration considerations",
    "FINANCE_TEAM": "financial analysis and cost-benefit breakdown"
  };

  const toneStyle = {
    "FORMAL": "formal and professional",
    "CONVERSATIONAL": "approachable yet professional",
    "PERSUASIVE": "compelling and benefit-focused",
    "ANALYTICAL": "data-driven and detailed"
  };

  const context = audienceContext[audience as keyof typeof audienceContext] || "general overview";
  const style = toneStyle[tone as keyof typeof toneStyle] || "professional";

  // Simulate AI-generated content
  const content = `# Executive Summary

## Overview
${existingContent ? "This is a regenerated version based on updated requirements and context." : ""}

This executive summary provides a ${context} for the RFP titled "${rfp.title}". This ${style} analysis is specifically tailored for ${audience.toLowerCase().replace(/_/g, " ")} stakeholders.

## Key Points

### Strategic Value
The proposed solution addresses critical business needs identified in the RFP process. Our analysis reveals significant opportunities for organizational improvement.

### Recommendation
Based on comprehensive evaluation, we recommend proceeding with the selected vendor solution. This recommendation is grounded in:

- **Alignment with Business Objectives**: The solution directly supports our strategic goals
- **Risk Mitigation**: Comprehensive risk assessment shows manageable exposure
- **Financial Viability**: The investment demonstrates strong ROI potential
- **Implementation Feasibility**: Clear path to deployment with defined milestones

### Next Steps
1. Review and approve this executive summary
2. Schedule stakeholder alignment meetings
3. Proceed with contract negotiations
4. Establish project governance structure

## Financial Considerations
Budget allocation of $${rfp.budget?.toLocaleString() || 'TBD'} has been reviewed and approved by the procurement team.

## Timeline
The proposed implementation timeline aligns with organizational priorities and resource availability.

---

*This summary was AI-generated based on RFP "${rfp.title}". Last updated: ${new Date().toLocaleDateString()}*
`;

  return content;
}
