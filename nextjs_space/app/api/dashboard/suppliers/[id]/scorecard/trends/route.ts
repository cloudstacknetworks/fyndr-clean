import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { calculateSupplierTrends } from "@/lib/scorecard-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trends = await calculateSupplierTrends(params.id, 10);
    return NextResponse.json({ trends });
  } catch (error) {
    console.error("Trends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
