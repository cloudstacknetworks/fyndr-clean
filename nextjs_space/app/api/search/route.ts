import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");
    const scope = searchParams.get("scope") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const results: any = {
      rfps: [],
      suppliers: [],
      responses: [],
      questions: [],
      activity: [],
      broadcasts: []
    };

    // BUYER SEARCH
    if (session.user.role === "buyer") {
      const userId = session.user.id;

      // Search RFPs (owned by buyer)
      if (scope === "all" || scope === "rfps") {
        results.rfps = await prisma.rFP.findMany({
          where: {
            userId,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { internalNotes: { contains: q, mode: "insensitive" } }
            ]
          },
          select: {
            id: true,
            title: true,
            status: true,
            stage: true,
            createdAt: true,
            opportunityScore: true
          },
          take: limit,
          orderBy: { createdAt: "desc" }
        });
      }

      // Search Suppliers
      if (scope === "all" || scope === "suppliers") {
        results.suppliers = await prisma.supplierContact.findMany({
          where: {
            rfp: { userId },
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { organization: { contains: q, mode: "insensitive" } }
            ]
          },
          include: { rfp: { select: { id: true, title: true } } },
          take: limit,
          orderBy: { createdAt: "desc" }
        });
      }

      // Search Responses
      if (scope === "all" || scope === "responses") {
        // Search in structuredAnswers JSON field
        const responses = await prisma.supplierResponse.findMany({
          where: {
            rfp: { userId }
          },
          include: {
            supplierContact: { select: { id: true, name: true, organization: true } },
            rfp: { select: { id: true, title: true } }
          },
          take: limit * 2 // Get more to filter
        });

        // Filter by keyword in structuredAnswers
        results.responses = responses.filter(r => {
          const answersStr = JSON.stringify(r.structuredAnswers || {}).toLowerCase();
          return answersStr.includes(q.toLowerCase());
        }).slice(0, limit);
      }

      // Search Questions
      if (scope === "all" || scope === "qa") {
        results.questions = await prisma.supplierQuestion.findMany({
          where: {
            rfp: { userId },
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } }
            ]
          },
          include: {
            supplierContact: { select: { name: true } },
            rfp: { select: { id: true, title: true } }
          },
          take: limit,
          orderBy: { askedAt: "desc" }
        });
      }

      // Search Activity
      if (scope === "all" || scope === "activity") {
        results.activity = await prisma.activityLog.findMany({
          where: {
            rfp: { userId },
            summary: { contains: q, mode: "insensitive" }
          },
          include: { rfp: { select: { id: true, title: true } } },
          take: limit,
          orderBy: { createdAt: "desc" }
        });
      }
    }

    // SUPPLIER SEARCH
    if (session.user.role === "supplier") {
      const supplierContact = await prisma.supplierContact.findFirst({
        where: { portalUserId: session.user.id }
      });

      if (!supplierContact) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Search own questions
      if (scope === "all" || scope === "qa") {
        results.questions = await prisma.supplierQuestion.findMany({
          where: {
            supplierContactId: supplierContact.id,
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } }
            ]
          },
          include: {
            rfp: { select: { id: true, title: true } }
          },
          take: limit,
          orderBy: { askedAt: "desc" }
        });
      }

      // Search own response
      if (scope === "all" || scope === "responses") {
        const responses = await prisma.supplierResponse.findMany({
          where: { supplierContactId: supplierContact.id }
        });

        results.responses = responses.filter(r => {
          const answersStr = JSON.stringify(r.structuredAnswers || {}).toLowerCase();
          return answersStr.includes(q.toLowerCase());
        }).slice(0, limit);
      }

      // Search broadcasts
      if (scope === "all" || scope === "broadcasts") {
        results.broadcasts = await prisma.supplierBroadcastMessage.findMany({
          where: {
            rfpId: supplierContact.rfpId,
            message: { contains: q, mode: "insensitive" }
          },
          take: limit,
          orderBy: { createdAt: "desc" }
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
