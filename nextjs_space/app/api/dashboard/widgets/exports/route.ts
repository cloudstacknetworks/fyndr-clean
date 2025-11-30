import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return available export types
    const exportTypes = [
      { type: "rfp_list", label: "RFP List", formats: ["CSV", "Excel"] },
      { type: "suppliers", label: "Supplier Contacts", formats: ["CSV", "Excel"] },
      { type: "qa", label: "Q&A Logs", formats: ["CSV", "Excel"] },
      { type: "tasks", label: "Stage Tasks", formats: ["CSV", "Excel"] },
      { type: "timeline", label: "Timeline", formats: ["CSV", "Excel", "PDF"] },
      { type: "response", label: "Supplier Response", formats: ["CSV", "Excel", "PDF"] },
      { type: "comparison", label: "Comparison Results", formats: ["CSV", "Excel", "PDF"] },
      { type: "bundle", label: "Complete Bundle", formats: ["ZIP"] }
    ];

    return NextResponse.json({ exportTypes });
  } catch (error) {
    console.error("Exports widget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
