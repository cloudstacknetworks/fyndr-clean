import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrCreateDemoScenario, resetDemoScenario } from "@/lib/demo/scenario";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "buyer") {
    return NextResponse.json({ error: "Forbidden - Buyer access only" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get("reset") === "true";

    const scenario = reset 
      ? await resetDemoScenario()
      : await getOrCreateDemoScenario();

    return NextResponse.json({
      success: true,
      data: {
        buyerUserId: scenario.demoBuyerUser.id,
        buyerOrgId: scenario.demoBuyerOrg.id,
        primaryRfpId: scenario.primaryRfp.id,
        secondaryRfpIds: scenario.secondaryRfps.map(r => r.id),
        supplierContactIds: scenario.suppliers.map(s => s.id),
        scenarioMetadata: scenario.scenarioMetadata
      }
    });
  } catch (error: any) {
    console.error("Demo seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data", details: error.message },
      { status: 500 }
    );
  }
}
