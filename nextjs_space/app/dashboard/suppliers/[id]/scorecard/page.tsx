import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Award, TrendingUp, Clock, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

async function getSupplierScorecard(supplierId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/suppliers/${supplierId}/scorecard`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch scorecard");
  return res.json();
}

export default async function SupplierScorecardPage({
  params
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "buyer") {
    redirect("/login");
  }

  const data = await getSupplierScorecard(params.id);
  const { supplier, kpis, trends, benchmarks } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link 
                href="/dashboard/suppliers"
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                ← Back to Suppliers
              </Link>
            </div>
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            <p className="text-gray-600">{supplier.organization || "N/A"}</p>
            <p className="text-sm text-gray-500">{supplier.email}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Reliability Index</div>
            <div className="text-4xl font-bold text-indigo-600">
              {kpis.reliabilityIndex.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
      </div>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard
          icon={<Award className="h-6 w-6 text-yellow-600" />}
          title="Win Rate"
          value={`${kpis.participation.winRate.toFixed(1)}%`}
          subtitle={`${kpis.participation.rfpsWon} of ${kpis.participation.rfpsResponded} RFPs`}
        />
        <KPICard
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          title="Avg Readiness"
          value={kpis.readiness.avgReadiness.toFixed(1)}
          subtitle="Readiness score"
        />
        <KPICard
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          title="Avg Final Score"
          value={benchmarks.scoreComparison.supplier.toFixed(1)}
          subtitle="Comparison score"
        />
        <KPICard
          icon={<DollarSign className="h-6 w-6 text-purple-600" />}
          title="Pricing"
          value={kpis.pricing.competitivenessIndex.toFixed(1)}
          subtitle="Competitiveness"
        />
        <KPICard
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          title="Avg Speed"
          value={`${kpis.speed.avgSubmissionSpeedDays.toFixed(1)}d`}
          subtitle="Submission time"
        />
      </div>

      {/* Trends Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Performance (Last 5 RFPs)</h2>
        {trends.length === 0 ? (
          <p className="text-gray-500">No RFP responses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">RFP Title</th>
                  <th className="text-right py-2">Final Score</th>
                  <th className="text-right py-2">Pricing Score</th>
                  <th className="text-right py-2">Readiness Score</th>
                  <th className="text-right py-2">Risk Flags</th>
                  <th className="text-right py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((trend: any) => (
                  <tr key={trend.rfpId} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <Link
                        href={`/dashboard/rfps/${trend.rfpId}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {trend.rfpTitle}
                      </Link>
                    </td>
                    <td className="text-right">{trend.finalScore.toFixed(1)}</td>
                    <td className="text-right">{trend.pricingScore.toFixed(1)}</td>
                    <td className="text-right">{trend.readinessScore.toFixed(1)}</td>
                    <td className="text-right">
                      {trend.riskFlags > 0 && (
                        <span className="text-red-600">{trend.riskFlags}</span>
                      )}
                      {trend.riskFlags === 0 && (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="text-right text-sm text-gray-600">
                      {trend.submittedAt
                        ? new Date(trend.submittedAt).toLocaleDateString()
                        : "Not submitted"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Benchmarking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Compared to Peers</h2>
        <div className="space-y-3">
          <BenchmarkItem
            label="Submission Speed"
            value={`${benchmarks.speedComparison.percentile.toFixed(0)}th percentile`}
            description={`Submits ${benchmarks.speedComparison.difference < 0 ? "faster" : "slower"} by ${Math.abs(benchmarks.speedComparison.difference).toFixed(1)} days vs. average`}
          />
          <BenchmarkItem
            label="Pricing Competitiveness"
            value={`${benchmarks.pricingComparison.percentile.toFixed(0)}th percentile`}
            description={`Pricing is ${Math.abs(benchmarks.pricingComparison.difference).toFixed(1)}% ${benchmarks.pricingComparison.difference > 0 ? "above" : "below"} average`}
          />
          <BenchmarkItem
            label="Overall Score"
            value={`${benchmarks.scoreComparison.percentile.toFixed(0)}th percentile`}
            description={`Scores ${Math.abs(benchmarks.scoreComparison.difference).toFixed(1)} points ${benchmarks.scoreComparison.difference > 0 ? "above" : "below"} peer average`}
          />
        </div>
      </div>

      {/* AI Summary */}
      <Suspense fallback={<div className="bg-white rounded-lg shadow p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <AISummarySection supplierId={params.id} />
      </Suspense>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Export Scorecard</h2>
        <div className="flex gap-3">
          <a
            href={`/api/dashboard/suppliers/${params.id}/scorecard/export?format=csv`}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  title,
  value,
  subtitle
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function BenchmarkItem({
  label,
  value,
  description
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="border-l-4 border-indigo-600 pl-4">
      <div className="flex justify-between items-center">
        <span className="font-medium">{label}</span>
        <span className="text-indigo-600 font-semibold">{value}</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
}

async function AISummarySection({ supplierId }: { supplierId: string }) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/suppliers/${supplierId}/scorecard/ai-summary`,
      {
        method: "POST",
        cache: "no-store"
      }
    );
    const data = await res.json();

    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">AI Supplier Profile</h2>
        <p className="text-gray-700 leading-relaxed">{data.summary}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">AI Supplier Profile</h2>
        <p className="text-gray-500">AI summary unavailable.</p>
      </div>
    );
  }
}
