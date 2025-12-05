import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { RFPStage } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const skip = (page - 1) * pageSize;

    // Filters
    const stage = searchParams.get("stage") as RFPStage | null;
    const status = searchParams.get("status");
    const slaRisk = searchParams.get("slaRisk"); // red, yellow, green
    const scoreMin = searchParams.get("scoreMin") ? parseInt(searchParams.get("scoreMin")!) : null;
    const scoreMax = searchParams.get("scoreMax") ? parseInt(searchParams.get("scoreMax")!) : null;
    const readiness = searchParams.get("readiness"); // READY, CONDITIONAL, NOT_READY
    const timelineWindow = searchParams.get("timelineWindow"); // qa, submission, demo, award
    const hasUnansweredQuestions = searchParams.get("hasUnansweredQuestions") === "true";
    const hasOverdueTasks = searchParams.get("hasOverdueTasks") === "true";
    const search = searchParams.get("search");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause with company scoping (PHASE 2: Security hardening)
    const where: any = {
      companyId: session.user.companyId
    };

    // Stage filter
    if (stage) {
      where.stage = stage;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Opportunity score range filter
    if (scoreMin !== null || scoreMax !== null) {
      where.opportunityScore = {};
      if (scoreMin !== null) {
        where.opportunityScore.gte = scoreMin;
      }
      if (scoreMax !== null) {
        where.opportunityScore.lte = scoreMax;
      }
    }

    // Search filter
    if (search && search.trim().length >= 2) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { internalNotes: { contains: search, mode: "insensitive" } }
      ];
    }

    // Fetch RFPs with filters
    const rfps = await prisma.rFP.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
        supplier: { select: { name: true } },
        supplierQuestions: {
          where: { status: "PENDING" },
          select: { id: true }
        },
        stageTasks: {
          where: {
            completed: false,
            stage: where.stage || undefined
          },
          select: { id: true }
        },
        supplierResponses: {
          where: { status: "SUBMITTED" },
          select: { 
            id: true, 
            readinessIndicator: true,
            supplierContact: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: sortBy === "createdAt" 
        ? { createdAt: sortOrder as "asc" | "desc" }
        : sortBy === "opportunityScore"
        ? { opportunityScore: sortOrder as "asc" | "desc" }
        : { createdAt: sortOrder as "asc" | "desc" },
      skip,
      take: pageSize
    });

    // Post-process filters that require calculation
    let filteredRfps = rfps;

    // SLA Risk filter
    if (slaRisk) {
      filteredRfps = filteredRfps.filter(rfp => {
        const now = new Date();
        const stageEntered = rfp.enteredStageAt || rfp.stageEnteredAt;
        if (!stageEntered) return false;

        const daysInStage = Math.floor((now.getTime() - stageEntered.getTime()) / (1000 * 60 * 60 * 24));
        const slaDays = rfp.stageSlaDays || 14;

        if (slaRisk === "red") return daysInStage > slaDays;
        if (slaRisk === "yellow") return daysInStage > slaDays * 0.8 && daysInStage <= slaDays;
        if (slaRisk === "green") return daysInStage <= slaDays * 0.8;
        return true;
      });
    }

    // Timeline window filter
    if (timelineWindow) {
      const now = new Date();
      filteredRfps = filteredRfps.filter(rfp => {
        if (timelineWindow === "qa") {
          return rfp.askQuestionsStart && rfp.askQuestionsEnd &&
                 now >= rfp.askQuestionsStart && now <= rfp.askQuestionsEnd;
        } else if (timelineWindow === "submission") {
          return rfp.submissionStart && rfp.submissionEnd &&
                 now >= rfp.submissionStart && now <= rfp.submissionEnd;
        } else if (timelineWindow === "demo") {
          return rfp.demoWindowStart && rfp.demoWindowEnd &&
                 now >= rfp.demoWindowStart && now <= rfp.demoWindowEnd;
        } else if (timelineWindow === "award") {
          return rfp.awardDate && now <= rfp.awardDate;
        }
        return true;
      });
    }

    // Readiness filter
    if (readiness) {
      filteredRfps = filteredRfps.filter(rfp => {
        return rfp.supplierResponses.some(r => r.readinessIndicator === readiness);
      });
    }

    // Unanswered questions filter
    if (hasUnansweredQuestions) {
      filteredRfps = filteredRfps.filter(rfp => rfp.supplierQuestions.length > 0);
    }

    // Overdue tasks filter (this is simplified - would need more complex logic in production)
    if (hasOverdueTasks) {
      filteredRfps = filteredRfps.filter(rfp => rfp.stageTasks.length > 0);
    }

    // Get total count for pagination
    const total = await prisma.rFP.count({ where });

    return NextResponse.json({
      rfps: filteredRfps,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("RFP list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
