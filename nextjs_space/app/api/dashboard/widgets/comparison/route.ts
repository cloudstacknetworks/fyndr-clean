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

    // Get RFPs with comparison results
    const rfps = await prisma.rFP.findMany({
      where: { 
        userId,
        supplierResponses: {
          some: {
            status: 'SUBMITTED',
            comparisonScore: {
              not: null
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        supplierResponses: {
          where: {
            status: 'SUBMITTED',
            comparisonScore: {
              not: null
            }
          },
          orderBy: {
            comparisonScore: 'desc'
          },
          take: 1,
          select: {
            comparisonScore: true,
            supplierContact: {
              select: {
                name: true,
                organization: true
              }
            }
          }
        }
      },
      take: 5
    });

    const topSuppliers = rfps.map(rfp => ({
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      topSupplier: rfp.supplierResponses[0]?.supplierContact.name || 'N/A',
      organization: rfp.supplierResponses[0]?.supplierContact.organization || 'N/A',
      score: rfp.supplierResponses[0]?.comparisonScore || 0
    }));

    return NextResponse.json({ topSuppliers });
  } catch (error) {
    console.error("Comparison widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
