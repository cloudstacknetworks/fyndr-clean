import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all supplier contacts for user's RFPs
    const contacts = await prisma.supplierContact.findMany({
      where: {
        rfp: {
          userId
        }
      },
      include: {
        rfp: {
          select: {
            title: true
          }
        },
        supplierResponse: {
          where: {
            status: 'SUBMITTED'
          },
          select: {
            extractedRequirementsCoverage: true
          }
        }
      },
      take: 10
    });

    const coverageData = contacts
      .filter(c => c.supplierResponse && c.supplierResponse.extractedRequirementsCoverage)
      .map(c => {
        const coverage = c.supplierResponse!.extractedRequirementsCoverage as any;
        let avgCoverage = 0;
        
        if (coverage && Array.isArray(coverage)) {
          const scores = coverage
            .filter((item: any) => item.coverageLevel)
            .map((item: any) => {
              if (item.coverageLevel === 'Exceeds') return 100;
              if (item.coverageLevel === 'Fully Meets') return 75;
              if (item.coverageLevel === 'Partially Meets') return 50;
              return 25;
            });
          
          avgCoverage = scores.length > 0 
            ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
            : 0;
        }
        
        return {
          supplier: c.name,
          rfpTitle: c.rfp.title,
          coverage: avgCoverage
        };
      });

    return NextResponse.json({ coverageData });
  } catch (error) {
    console.error("Coverage widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
