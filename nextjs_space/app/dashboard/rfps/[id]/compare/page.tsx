/**
 * Supplier Comparison Dashboard
 * 
 * Side-by-side comparison of supplier responses with weighted scoring
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Sparkles,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ComparisonData {
  success: boolean;
  matrixUsed: boolean;
  matrixName: string;
  comparisons: Array<{
    supplierName: string;
    supplierEmail: string;
    organization?: string;
    totalScore: number;
    metrics: {
      requirementsCoverage: number;
      pricingCompetitiveness: number;
      technicalStrength: number;
      differentiators: number;
      riskProfile: number;
      assumptionsQuality: number;
      demoQuality: number;
      totalCost?: number;
    };
    weightedScores: {
      requirementsCoverage: number;
      pricingCompetitiveness: number;
      technicalStrength: number;
      differentiators: number;
      riskProfile: number;
      assumptionsQuality: number;
      demoQuality: number;
    };
  }>;
  rfpTitle: string;
}

interface AISummary {
  executiveSummary: string;
  recommendedSupplier: string;
  reasoning: string;
  pricingObservations: string;
  requirementsGaps: string;
  majorRisks: string;
  strengthsWeaknesses: Array<{
    supplier: string;
    strengths: string[];
    weaknesses: string[];
  }>;
}

export default function ComparisonPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pricing: false,
    requirements: false,
    technical: false,
    differentiators: false,
    risks: false,
  });

  const rfpId = params.id;

  // Run comparison
  const handleRunComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/comparison/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run comparison');
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI summary
  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/comparison/ai-summary`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI summary');
      }

      const data = await response.json();
      setAiSummary(data.aiSummary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Get color for ranking
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-green-100 text-green-700';
    if (rank === 2) return 'bg-amber-100 text-amber-700';
    if (rank === 3) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Get color for metric comparison (best/middle/worst)
  const getMetricColor = (value: number, values: number[], inverse: boolean = false) => {
    const max = Math.max(...values);
    const min = Math.min(...values);

    if (inverse) {
      if (value === min) return 'text-red-600 bg-red-50';
      if (value === max) return 'text-green-600 bg-green-50';
    } else {
      if (value === max) return 'text-green-600 bg-green-50';
      if (value === min) return 'text-red-600 bg-red-50';
    }

    return 'text-amber-600 bg-amber-50';
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/dashboard/rfps/${rfpId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to RFP Detail
          </Link>

          <div className="flex justify-between items-start mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Supplier Comparison
              </h1>
              {comparisonData && (
                <p className="text-sm text-gray-600 mt-1">{comparisonData.rfpTitle}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/dashboard/rfps/${rfpId}/matrix`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Evaluation Matrix
              </Link>

              <button
                onClick={handleRunComparison}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Comparison
              </button>

              {comparisonData && (
                <button
                  onClick={handleGenerateAISummary}
                  disabled={aiLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate AI Summary
                </button>
              )}
            </div>
          </div>

          {/* Matrix indicator */}
          {comparisonData && (
            <div className="mt-3 text-sm">
              <span className="text-gray-600">Using: </span>
              <span className="font-medium text-gray-900">{comparisonData.matrixName}</span>
              {!comparisonData.matrixUsed && (
                <span className="ml-2 text-gray-500">(Default Weights)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!comparisonData && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Comparison Data Yet
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Click "Run Comparison" to analyze and compare all submitted supplier responses.
            </p>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonData && (
          <div className="space-y-6">
            {/* Side-by-Side Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Overall Comparison
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      {comparisonData.comparisons.map((comparison, idx) => (
                        <th
                          key={idx}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankColor(
                                idx + 1
                              )}`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-900 normal-case">
                                {comparison.supplierName}
                              </div>
                              {comparison.organization && (
                                <div className="text-xs text-gray-500 normal-case font-normal">
                                  {comparison.organization}
                                </div>
                              )}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Final Weighted Score */}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Final Weighted Score
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => (
                        <td key={idx} className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getRankColor(
                              idx + 1
                            )}`}
                          >
                            {comparison.totalScore} / 100
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Requirements Coverage */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Requirements Coverage
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.requirementsCoverage
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.requirementsCoverage,
                                values
                              )}`}
                            >
                              {comparison.metrics.requirementsCoverage.toFixed(0)}%
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{
                                  width: `${comparison.metrics.requirementsCoverage}%`,
                                }}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Pricing Competitiveness */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          Pricing Competitiveness
                        </div>
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.pricingCompetitiveness
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.pricingCompetitiveness,
                                values
                              )}`}
                            >
                              {comparison.metrics.pricingCompetitiveness.toFixed(0)}
                            </div>
                            {comparison.metrics.totalCost && (
                              <div className="text-xs text-gray-500 mt-1">
                                ${comparison.metrics.totalCost.toLocaleString()}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Technical Strength */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Technical Strength
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.technicalStrength
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.technicalStrength,
                                values
                              )}`}
                            >
                              {comparison.metrics.technicalStrength.toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Differentiators */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Differentiators
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.differentiators
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.differentiators,
                                values
                              )}`}
                            >
                              {comparison.metrics.differentiators.toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Risk Profile (inverse) */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Risk Profile
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.riskProfile
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.riskProfile,
                                values
                              )}`}
                            >
                              {comparison.metrics.riskProfile.toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Assumptions Quality (inverse) */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Assumptions Quality
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.assumptionsQuality
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.assumptionsQuality,
                                values
                              )}`}
                            >
                              {comparison.metrics.assumptionsQuality.toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Demo Quality */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Demo Quality
                      </td>
                      {comparisonData.comparisons.map((comparison, idx) => {
                        const values = comparisonData.comparisons.map(
                          (c) => c.metrics.demoQuality
                        );
                        return (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${getMetricColor(
                                comparison.metrics.demoQuality,
                                values
                              )}`}
                            >
                              {comparison.metrics.demoQuality.toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Legend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span className="text-gray-600">Best in category</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                  <span className="text-gray-600">Middle range</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span className="text-gray-600">Lowest in category</span>
                </div>
              </div>
            </div>

            {/* AI Summary Panel */}
            {aiSummary && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">
                      AI Decision Summary
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Executive Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Executive Summary
                    </h3>
                    <p className="text-sm text-gray-700">{aiSummary.executiveSummary}</p>
                  </div>

                  {/* Recommended Supplier */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-green-900 mb-1">
                          Recommended Supplier
                        </h3>
                        <p className="text-lg font-bold text-green-700 mb-2">
                          {aiSummary.recommendedSupplier}
                        </p>
                        <p className="text-sm text-green-800">{aiSummary.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Observations */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Pricing Observations
                    </h3>
                    <p className="text-sm text-gray-700">{aiSummary.pricingObservations}</p>
                  </div>

                  {/* Requirements Gaps */}
                  {aiSummary.requirementsGaps && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Requirements Gaps
                      </h3>
                      <p className="text-sm text-gray-700">{aiSummary.requirementsGaps}</p>
                    </div>
                  )}

                  {/* Major Risks */}
                  {aiSummary.majorRisks && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-amber-900 mb-1">
                            Major Risks
                          </h3>
                          <p className="text-sm text-amber-800">{aiSummary.majorRisks}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {aiSummary.strengthsWeaknesses &&
                    aiSummary.strengthsWeaknesses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Strengths & Weaknesses
                        </h3>
                        <div className="space-y-4">
                          {aiSummary.strengthsWeaknesses.map((item, idx) => (
                            <div
                              key={idx}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="font-medium text-gray-900 mb-3">
                                {item.supplier}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs font-semibold text-green-700 mb-2">
                                    Strengths
                                  </div>
                                  <ul className="space-y-1">
                                    {item.strengths.map((strength, sIdx) => (
                                      <li
                                        key={sIdx}
                                        className="text-sm text-gray-700 flex items-start gap-2"
                                      >
                                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-red-700 mb-2">
                                    Weaknesses
                                  </div>
                                  <ul className="space-y-1">
                                    {item.weaknesses.map((weakness, wIdx) => (
                                      <li
                                        key={wIdx}
                                        className="text-sm text-gray-700 flex items-start gap-2"
                                      >
                                        <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span>{weakness}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
