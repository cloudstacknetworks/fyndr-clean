import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden - Buyer access only" }, { status: 403 });
  }

  try {
    const demoRfpCount = await prisma.rFP.count({ where: { isDemo: true } });
    const demoSupplierCount = await prisma.supplierContact.count({ where: { isDemo: true } });
    const demoBuyer = await prisma.user.findFirst({
      where: { email: "diane.demo@cloudstack.com", isDemo: true },
      select: { createdAt: true }
    });

    return NextResponse.json({
      exists: demoRfpCount > 0 && demoSupplierCount > 0,
      demoRfpCount,
      demoSupplierCount,
      lastSeeded: demoBuyer?.createdAt || null
    });
  } catch (error: any) {
    console.error("Demo status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo status", details: error.message },
      { status: 500 }
    );
  }
}
