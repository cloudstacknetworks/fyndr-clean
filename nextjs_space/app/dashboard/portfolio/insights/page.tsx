/**
 * Portfolio Insights Dashboard UI (STEP 44)
 * 
 * Provides comprehensive portfolio-level analytics across all RFPs for a company.
 * Buyer-only access, company-scoped.
 * Features: Summary tiles, score distribution, supplier participation, budget analysis, cycle time analysis, insights.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Option3Indicator } from "@/app/components/option3/option3-indicator";

interface PortfolioInsights {
  companyId: string;
  generatedAt: string;
  highLevelCounts: {
    totalRfps: number;
    activeRfps: number;
    awardedRfps: number;
    cancelledRfps: number;
    inPlanning: number;
    inInvitation: number;
    inQA: number;
    inSubmission: number;
    inEvaluation: number;
    inDemo: number;
  };
  budgetMetrics: {
    totalBudgetAcrossRfps: number;
    averageBudget: number;
    medianBudget: number;
    highestBudgetRfp: { id: string; title: string; budget: number } | null;
    lowestBudgetRfp: { id: string; title: string; budget: number } | null;
  };
  timelineMetrics: {
    averageCycleTime: number;
    medianCycleTime: number;
    longestCycleTime: number;
    shortestCycleTime: number;
    cycleTimeByPhase: {
      planning: number;
      invitation: number;
      qa: number;
      submission: number;
      evaluation: number;
      demo: number;
    };
  };
  scoringMetrics: {
    averageSupplierScore: number | null;
    averageWeightedScore: number | null;
    scoreDistribution: {
      range90to100: number;
      range80to89: number;
      range70to79: number;
      range60to69: number;
      below60: number;
    };
    mustHaveComplianceRate: number | null;
  };
  supplierParticipation: {
    totalSuppliersParticipating: number;
    participationBySupplier: Array<{
      supplierId: string;
      supplierName: string;
      participationCount: number;
      shortlistedCount: number;
      awardedCount: number;
      declinedCount: number;
    }>;
  };
  portfolioInsights: string[];
}

export default function PortfolioInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [insights, setInsights] = useState<PortfolioInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "BUYER") {
      router.push("/dashboard");
      return;
    }

    fetchInsights();
  }, [session, status, router]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/portfolio/insights");
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio insights");
      }

      const data = await response.json();
      setInsights(data);
    } catch (err: any) {
      console.error("Error fetching insights:", err);
      setError(err.message || "An error occurred while fetching insights");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const response = await fetch("/api/dashboard/portfolio/insights/pdf");
      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Portfolio_Insights_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading portfolio insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="inline-block w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Insights</h2>
          <p className="text-gray-600 mb-6">{error || "Unable to load portfolio insights"}</p>
          <button
            onClick={fetchInsights}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">📊 Portfolio Insights Dashboard</h1>
              <p className="text-blue-100">
                Comprehensive analytics across all RFPs • Generated on {formatDate(insights.generatedAt)}
              </p>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="px-5 py-2.5 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* High-Level Summary Tiles */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">High-Level Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryTile
              label="Total RFPs"
              value={insights.highLevelCounts.totalRfps}
              icon="📋"
              color="blue"
            />
            <SummaryTile
              label="Active RFPs"
              value={insights.highLevelCounts.activeRfps}
              icon="🚀"
              color="green"
            />
            <SummaryTile
              label="Awarded"
              value={insights.highLevelCounts.awardedRfps}
              icon="🏆"
              color="yellow"
            />
            <SummaryTile
              label="Cancelled"
              value={insights.highLevelCounts.cancelledRfps}
              icon="❌"
              color="red"
            />
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">RFPs by Phase</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <PhaseCard label="Planning" count={insights.highLevelCounts.inPlanning} />
            <PhaseCard label="Invitation" count={insights.highLevelCounts.inInvitation} />
            <PhaseCard label="Q&A" count={insights.highLevelCounts.inQA} />
            <PhaseCard label="Submission" count={insights.highLevelCounts.inSubmission} />
            <PhaseCard label="Evaluation" count={insights.highLevelCounts.inEvaluation} />
            <PhaseCard label="Demo" count={insights.highLevelCounts.inDemo} />
          </div>
        </div>

        {/* Budget Metrics */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Budget Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              label="Total Portfolio Value"
              value={formatCurrency(insights.budgetMetrics.totalBudgetAcrossRfps)}
            />
            <MetricCard
              label="Average Budget"
              value={formatCurrency(insights.budgetMetrics.averageBudget)}
            />
            <MetricCard
              label="Median Budget"
              value={formatCurrency(insights.budgetMetrics.medianBudget)}
            />
            <MetricCard
              label="Budget Range"
              value={`${
                insights.budgetMetrics.lowestBudgetRfp
                  ? formatCurrency(insights.budgetMetrics.lowestBudgetRfp.budget)
                  : "N/A"
              } - ${
                insights.budgetMetrics.highestBudgetRfp
                  ? formatCurrency(insights.budgetMetrics.highestBudgetRfp.budget)
                  : "N/A"
              }`}
              small
            />
          </div>
          {insights.budgetMetrics.highestBudgetRfp && (
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-md p-3">
                <div className="font-medium text-green-900">Highest Budget RFP</div>
                <div className="text-green-700 mt-1">
                  {insights.budgetMetrics.highestBudgetRfp.title} -{" "}
                  {formatCurrency(insights.budgetMetrics.highestBudgetRfp.budget)}
                </div>
              </div>
              {insights.budgetMetrics.lowestBudgetRfp && (
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="font-medium text-blue-900">Lowest Budget RFP</div>
                  <div className="text-blue-700 mt-1">
                    {insights.budgetMetrics.lowestBudgetRfp.title} -{" "}
                    {formatCurrency(insights.budgetMetrics.lowestBudgetRfp.budget)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline Metrics */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⏱️ Cycle Time Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Average Cycle Time"
              value={`${insights.timelineMetrics.averageCycleTime} days`}
            />
            <MetricCard
              label="Median Cycle Time"
              value={`${insights.timelineMetrics.medianCycleTime} days`}
            />
            <MetricCard
              label="Shortest Cycle"
              value={`${insights.timelineMetrics.shortestCycleTime} days`}
            />
            <MetricCard
              label="Longest Cycle"
              value={`${insights.timelineMetrics.longestCycleTime} days`}
            />
          </div>
        </div>

        {/* Scoring Metrics */}
        {insights.scoringMetrics.averageSupplierScore !== null && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⭐ Score Distribution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <ScoreRangeCard
                label="90-100"
                count={insights.scoringMetrics.scoreDistribution.range90to100}
                color="green"
              />
              <ScoreRangeCard
                label="80-89"
                count={insights.scoringMetrics.scoreDistribution.range80to89}
                color="blue"
              />
              <ScoreRangeCard
                label="70-79"
                count={insights.scoringMetrics.scoreDistribution.range70to79}
                color="yellow"
              />
              <ScoreRangeCard
                label="60-69"
                count={insights.scoringMetrics.scoreDistribution.range60to69}
                color="orange"
              />
              <ScoreRangeCard
                label="Below 60"
                count={insights.scoringMetrics.scoreDistribution.below60}
                color="red"
              />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-purple-50 border border-purple-200 rounded-md p-3">
                <div className="font-medium text-purple-900">Average Supplier Score</div>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  {insights.scoringMetrics.averageSupplierScore}/100
                </div>
              </div>
              {insights.scoringMetrics.mustHaveComplianceRate !== null && (
                <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-md p-3">
                  <div className="font-medium text-indigo-900">Must-Have Compliance</div>
                  <div className="text-2xl font-bold text-indigo-700 mt-1">
                    {insights.scoringMetrics.mustHaveComplianceRate}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supplier Participation */}
        {insights.supplierParticipation.participationBySupplier.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🏢 Supplier Participation (Top 10)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total RFPs
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shortlisted
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Awarded
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Declined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {insights.supplierParticipation.participationBySupplier
                    .slice(0, 10)
                    .map((supplier, index) => (
                      <tr key={supplier.supplierId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                              {index + 1}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {supplier.supplierName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {supplier.participationCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {supplier.shortlistedCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {supplier.awardedCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {supplier.declinedCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Portfolio Insights */}
        {insights.portfolioInsights.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Key Portfolio Insights</h2>
            <ul className="space-y-3">
              {insights.portfolioInsights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 text-amber-500 font-bold mr-3">→</span>
                  <span className="text-gray-800">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Option3Indicator */}
        <div className="mb-8">
          <Option3Indicator />
        </div>
      </div>
    </div>
  );
}

// ========================================
// UI Components
// ========================================

function SummaryTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    red: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg shadow-sm p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-70">{icon}</div>
      </div>
    </div>
  );
}

function PhaseCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-xs font-medium text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
      <div className="text-xs font-medium text-gray-600 mb-2">{label}</div>
      <div className={`${small ? "text-base" : "text-2xl"} font-bold text-gray-900`}>{value}</div>
    </div>
  );
}

function ScoreRangeCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "green" | "blue" | "yellow" | "orange" | "red";
}) {
  const colorClasses = {
    green: "bg-green-50 border-green-300 text-green-900",
    blue: "bg-blue-50 border-blue-300 text-blue-900",
    yellow: "bg-yellow-50 border-yellow-300 text-yellow-900",
    orange: "bg-orange-50 border-orange-300 text-orange-900",
    red: "bg-red-50 border-red-300 text-red-900",
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-4 text-center`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
    </div>
  );
}
