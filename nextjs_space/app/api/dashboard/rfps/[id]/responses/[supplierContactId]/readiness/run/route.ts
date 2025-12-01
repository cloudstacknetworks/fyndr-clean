import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { updateResponseReadiness } from "@/lib/readiness/readiness-calculator";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; supplierContactId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden - Buyer access only" }, { status: 403 });
  }

  try {
    // Find response by supplierContactId
    const response = await prisma.supplierResponse.findUnique({
      where: { supplierContactId: params.supplierContactId },
      include: { supplierContact: true }
    });

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    await updateResponseReadiness(response.id);

    // Log activity
    await prisma.activityLog.create({
      data: {
        rfpId: params.id,
        userId: session.user.id,
        eventType: "READINESS_ANALYZED",
        description: `Readiness analysis run for ${response.supplierContact.name}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Readiness calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate readiness", details: error.message },
      { status: 500 }
    );
  }
}
