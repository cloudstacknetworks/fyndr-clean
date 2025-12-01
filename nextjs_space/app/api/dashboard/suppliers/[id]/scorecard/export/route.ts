import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { calculateSupplierKPIs, calculateSupplierTrends } from "@/lib/scorecard-utils";

function generateCSV(data: any[][]): string {
  return data.map(row => 
    row.map(cell => {
      const str = cell === null || cell === undefined ? "" : String(cell);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  ).join("\n");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    const kpis = await calculateSupplierKPIs(params.id);
    const trends = await calculateSupplierTrends(params.id, 10);

    const data = [
      ["Metric", "Value"],
      ["Win Rate", `${kpis.participation.winRate.toFixed(1)}%`],
      ["RFPs Invited", kpis.participation.rfpsInvited.toString()],
      ["RFPs Responded", kpis.participation.rfpsResponded.toString()],
      ["RFPs Won", kpis.participation.rfpsWon.toString()],
      ["Avg Readiness", kpis.readiness.avgReadiness.toFixed(1)],
      ["Requirements Coverage", `${kpis.readiness.requirementsCoverage.toFixed(1)}%`],
      ["Avg Submission Speed", `${kpis.speed.avgSubmissionSpeedDays.toFixed(1)} days`],
      ["Fastest Submission", `${kpis.speed.fastestSubmission} days`],
      ["Slowest Submission", `${kpis.speed.slowestSubmission} days`],
      ["Reliability Index", kpis.reliabilityIndex.toFixed(1)],
      ["Pricing Competitiveness", kpis.pricing.competitivenessIndex.toFixed(1)],
      ["Response Completeness", `${kpis.quality.responseCompleteness.toFixed(1)}%`],
      [""],
      ["Recent RFPs", ""],
      ["RFP Title", "Final Score", "Pricing Score", "Readiness Score", "Risk Flags"],
      ...trends.map((t: any) => [
        t.rfpTitle, 
        t.finalScore.toFixed(1), 
        t.pricingScore.toFixed(1), 
        t.readinessScore.toFixed(1),
        t.riskFlags.toString()
      ])
    ];

    if (format === "csv") {
      const csv = generateCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="supplier-scorecard-${params.id}.csv"`
        }
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
