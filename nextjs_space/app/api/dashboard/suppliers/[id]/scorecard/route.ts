import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { calculateSupplierKPIs, calculateSupplierTrends, calculateSupplierBenchmarks } from "@/lib/scorecard-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supplierId = params.id;

    // Verify supplier exists
    const supplier = await prisma.supplierContact.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Calculate KPIs
    const kpis = await calculateSupplierKPIs(supplierId);
    const trends = await calculateSupplierTrends(supplierId, 5);
    const benchmarks = await calculateSupplierBenchmarks(supplierId);

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        organization: supplier.organization,
        email: supplier.email
      },
      kpis,
      trends,
      benchmarks
    });
  } catch (error) {
    console.error("Scorecard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
