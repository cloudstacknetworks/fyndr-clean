'use client';

/**
 * Multi-RFP Comparison Workspace (STEP 49)
 * 
 * Displays side-by-side comparison of 2-5 RFPs with:
 * 1. Header bar with export buttons
 * 2. Overview table
 * 3. Snapshot availability matrix
 * 4. Cycle time visualization
 * 5. Supplier participation map
 * 6. Cross-RFP insights
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileText,
  GitCompare,
  Loader2,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface RfpComparisonData {
  rfpId: string;
  title: string;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  supplierCount: number;
  awardStatus: string | null;
  snapshotAvailability: {
    decisionBrief: boolean;
    scoringMatrix: boolean;
    timelineState: boolean;
    awardSnapshot: boolean;
  };
  cycleTimeInDays: number;
  avgSupplierScore: number | null;
  mustHaveComplianceAvg: number | null;
}

interface CrossRfpInsights {
  longestCycleTimeRfp: string | null;
  shortestCycleTimeRfp: string | null;
  highestBudgetRfp: string | null;
  lowestBudgetRfp: string | null;
  totalSupplierParticipation: number;
  avgCycleTime: number;
  budgetRange: { min: number | null; max: number | null };
  avgBudget: number | null;
  algorithmicInsights: string[];
}

interface ComparisonResult {
  rfpComparisons: RfpComparisonData[];
  crossInsights: CrossRfpInsights;
  supplierParticipationMap: { [supplierName: string]: number };
  metadata: {
    totalRfps: number;
    avgCycleTime: number;
    budgetRange: { min: number | null; max: number | null };
    avgBudget: number | null;
  };
}

export default function MultiRfpComparisonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  const rfpIds = searchParams.get('rfpIds')?.split(',') || [];

  useEffect(() => {
    if (rfpIds.length < 2 || rfpIds.length > 5) {
      setError('Invalid RFP selection. Please select 2-5 RFPs.');
      setLoading(false);
      return;
    }

    fetchComparisonData();
  }, [rfpIds]);

  const fetchComparisonData = async () => {
    try {
      const response = await fetch('/api/dashboard/rfps/compare-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfpIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch comparison data');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await fetch('/api/dashboard/rfps/compare-multi/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfpIds }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multi-rfp-comparison-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    setExportingDocx(true);
    try {
      const response = await fetch('/api/dashboard/rfps/compare-multi/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfpIds }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multi-rfp-comparison-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export DOCX');
    } finally {
      setExportingDocx(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-fuchsia-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Comparison Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href="/dashboard/portfolio"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { rfpComparisons, crossInsights, supplierParticipationMap, metadata } = data;

  return (
    <div className="p-8 space-y-8">
      {/* ================================================================
          SECTION 1: HEADER BAR
          ================================================================ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/portfolio"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Multi-RFP Comparison</h1>
              <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 text-sm font-medium rounded-full">
                {rfpComparisons.length} RFPs
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Side-by-side analysis of {rfpComparisons.length} RFPs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export PDF
          </button>
          <button
            onClick={handleExportDocx}
            disabled={exportingDocx}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {exportingDocx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export DOCX
          </button>
        </div>
      </div>

      {/* ================================================================
          SECTION 2: OVERVIEW TABLE
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-fuchsia-600" />
          Overview Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                {rfpComparisons.map((rfp) => (
                  <th key={rfp.rfpId} className="text-left py-3 px-4 font-semibold text-gray-700">
                    {rfp.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Budget Row */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Budget</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4">
                    {rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A'}
                  </td>
                ))}
              </tr>
              {/* Created Date Row */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Created</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4">
                    {new Date(rfp.createdAt).toLocaleDateString()}
                  </td>
                ))}
              </tr>
              {/* Supplier Count Row */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Suppliers</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4">
                    {rfp.supplierCount}
                  </td>
                ))}
              </tr>
              {/* Cycle Time Row */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Cycle Time (days)</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4">
                    {rfp.cycleTimeInDays}
                  </td>
                ))}
              </tr>
              {/* Award Status Row */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Award Status</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rfp.awardStatus === 'awarded'
                          ? 'bg-green-100 text-green-700'
                          : rfp.awardStatus === 'recommended'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {rfp.awardStatus || 'Not awarded'}
                    </span>
                  </td>
                ))}
              </tr>
              {/* Avg Supplier Score Row */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Avg Supplier Score</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4">
                    {rfp.avgSupplierScore !== null ? rfp.avgSupplierScore : 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================
          SECTION 3: SNAPSHOT AVAILABILITY MATRIX
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-fuchsia-600" />
          Snapshot Availability
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Snapshot Type</th>
                {rfpComparisons.map((rfp) => (
                  <th key={rfp.rfpId} className="text-center py-3 px-4 font-semibold text-gray-700">
                    {rfp.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Decision Brief</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4 text-center">
                    {rfp.snapshotAvailability.decisionBrief ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Scoring Matrix</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4 text-center">
                    {rfp.snapshotAvailability.scoringMatrix ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Timeline State</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4 text-center">
                    {rfp.snapshotAvailability.timelineState ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium text-gray-700">Award Snapshot</td>
                {rfpComparisons.map((rfp) => (
                  <td key={rfp.rfpId} className="py-3 px-4 text-center">
                    {rfp.snapshotAvailability.awardSnapshot ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================
          SECTION 4: CYCLE TIME VISUALIZATION
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-fuchsia-600" />
          Cycle Time Comparison
        </h2>
        <div className="space-y-4">
          {rfpComparisons.map((rfp) => {
            const maxCycleTime = Math.max(...rfpComparisons.map((r) => r.cycleTimeInDays));
            const barWidth = (rfp.cycleTimeInDays / maxCycleTime) * 100;
            return (
              <div key={rfp.rfpId}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{rfp.title}</span>
                  <span className="text-sm text-gray-600">{rfp.cycleTimeInDays} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-fuchsia-600 h-4 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Average Cycle Time:</strong> {metadata.avgCycleTime} days
          </p>
        </div>
      </div>

      {/* ================================================================
          SECTION 5: SUPPLIER PARTICIPATION MAP
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-fuchsia-600" />
          Supplier Participation
        </h2>
        {Object.keys(supplierParticipationMap).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No supplier participation data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(supplierParticipationMap)
              .sort(([, a], [, b]) => b - a)
              .map(([supplierName, count]) => (
                <div key={supplierName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">{supplierName}</span>
                  <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 text-sm font-semibold rounded-full">
                    {count} RFP{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
          </div>
        )}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Total Supplier Participation:</strong> {crossInsights.totalSupplierParticipation}
          </p>
        </div>
      </div>

      {/* ================================================================
          SECTION 6: CROSS-RFP INSIGHTS
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-fuchsia-600" />
          Cross-RFP Insights
        </h2>
        
        {/* Key Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">Longest Cycle</h3>
            </div>
            <p className="text-sm text-blue-700">{crossInsights.longestCycleTimeRfp || 'N/A'}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-900">Shortest Cycle</h3>
            </div>
            <p className="text-sm text-green-700">{crossInsights.shortestCycleTimeRfp || 'N/A'}</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-900">Highest Budget</h3>
            </div>
            <p className="text-sm text-purple-700">{crossInsights.highestBudgetRfp || 'N/A'}</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-900">Lowest Budget</h3>
            </div>
            <p className="text-sm text-amber-700">{crossInsights.lowestBudgetRfp || 'N/A'}</p>
          </div>
        </div>

        {/* Algorithmic Insights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Algorithmic Insights</h3>
          {crossInsights.algorithmicInsights.length === 0 ? (
            <p className="text-gray-500">No insights available</p>
          ) : (
            <ul className="space-y-2">
              {crossInsights.algorithmicInsights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-fuchsia-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-800">{insight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
