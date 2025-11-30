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

    // Get pricing data from recent RFPs
    const responses = await prisma.supplierResponse.findMany({
      where: {
        supplierContact: {
          rfp: {
            userId
          }
        },
        status: 'SUBMITTED'
      },
      select: {
        extractedPricing: true,
        submittedAt: true,
        supplierContact: {
          select: {
            rfp: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    });

    const pricingTrends = responses
      .filter(r => r.extractedPricing && typeof r.extractedPricing === 'object')
      .map(r => {
        const pricing = r.extractedPricing as any;
        return {
          rfpTitle: r.supplierContact.rfp.title,
          totalCost: pricing.totalCost || pricing.total || 0,
          submittedAt: r.submittedAt?.toISOString()
        };
      });

    return NextResponse.json({ pricingTrends });
  } catch (error) {
    console.error("Pricing widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
