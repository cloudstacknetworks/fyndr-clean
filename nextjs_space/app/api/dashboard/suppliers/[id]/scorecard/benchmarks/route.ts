import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { calculateSupplierBenchmarks } from "@/lib/scorecard-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const benchmarks = await calculateSupplierBenchmarks(params.id);
    return NextResponse.json({ benchmarks });
  } catch (error) {
    console.error("Benchmarks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
