'use client';

/**
 * Portfolio Overview Page (STEP 35 + STEP 49)
 * 
 * Displays cross-RFP insights for the buyer's entire pipeline:
 * - Section 1: Header Bar with KPIs
 * - Section 2: KPI Row
 * - Section 3: Stage Distribution
 * - Section 4: Risk & Readiness
 * - Section 5: Top Suppliers
 * - Section 6: Upcoming Milestones
 * - Section 7: Option 3 Teaser
 * - Section 8: Multi-RFP Comparison (STEP 49)
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Users, 
  DollarSign,
  Award,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  GitCompare
} from 'lucide-react';
import { Option3Indicator } from '@/app/components/option3/option3-indicator';
import { STAGE_LABELS } from '@/lib/stages';

interface PortfolioData {
  snapshot: any;
  meta: any;
}

interface RfpListItem {
  id: string;
  title: string;
  status: string;
  stage: string;
  createdAt: string;
  budget: number | null;
  isArchived: boolean;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // STEP 49: Multi-RFP Comparison State
  const [selectedRfpIds, setSelectedRfpIds] = useState<Set<string>>(new Set());
  const [rfpList, setRfpList] = useState<RfpListItem[]>([]);
  const [loadingRfpList, setLoadingRfpList] = useState(false);
  const [showComparisonSelector, setShowComparisonSelector] = useState(false);
  const router = useRouter();

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/dashboard/portfolio/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPortfolioData();
  };

  // STEP 49: Fetch RFP list for comparison
  const fetchRfpList = async () => {
    setLoadingRfpList(true);
    try {
      const response = await fetch('/api/dashboard/rfps');
      if (!response.ok) {
        throw new Error('Failed to fetch RFP list');
      }
      const result = await response.json();
      // Filter out archived RFPs for comparison
      const activeRfps = result.rfps.filter((rfp: RfpListItem) => !rfp.isArchived);
      setRfpList(activeRfps);
    } catch (err) {
      console.error('Error fetching RFP list:', err);
    } finally {
      setLoadingRfpList(false);
    }
  };

  // STEP 49: Toggle comparison selector
  const handleToggleComparisonSelector = () => {
    if (!showComparisonSelector) {
      fetchRfpList();
    }
    setShowComparisonSelector(!showComparisonSelector);
    setSelectedRfpIds(new Set()); // Reset selection when toggling
  };

  // STEP 49: Toggle RFP selection
  const handleToggleRfpSelection = (rfpId: string) => {
    const newSelection = new Set(selectedRfpIds);
    if (newSelection.has(rfpId)) {
      newSelection.delete(rfpId);
    } else {
      // Limit to 5 RFPs
      if (newSelection.size >= 5) {
        alert('You can select a maximum of 5 RFPs for comparison');
        return;
      }
      newSelection.add(rfpId);
    }
    setSelectedRfpIds(newSelection);
  };

  // STEP 49: Navigate to comparison workspace
  const handleCompareRfps = () => {
    if (selectedRfpIds.size < 2) {
      alert('Please select at least 2 RFPs to compare');
      return;
    }
    if (selectedRfpIds.size > 5) {
      alert('You can only compare up to 5 RFPs at once');
      return;
    }
    const rfpIds = Array.from(selectedRfpIds).join(',');
    router.push(`/dashboard/rfps/compare-multi?rfpIds=${rfpIds}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Portfolio</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const snapshot = data?.snapshot;
  const meta = data?.meta;

  if (!snapshot) {
    return (
      <div className="p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">No portfolio data available</p>
        </div>
      </div>
    );
  }

  const { kpis, stages, riskBands, readinessDistribution, topSuppliers, upcomingMilestones, spendSummary } = snapshot;

  return (
    <div className="p-8 space-y-8" data-demo="portfolio-overview">
      {/* ================================================================
          SECTION 1: HEADER BAR
          ================================================================ */}
      <div className="flex items-center justify-between" data-demo="portfolio-header">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Overview</h1>
            <Option3Indicator />
          </div>
          <p className="text-gray-600 mt-1">Cross-RFP insights for your entire pipeline</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(meta?.lastGeneratedAt).toLocaleString()}
          </div>
          {/* STEP 49: Compare RFPs Button */}
          <button
            onClick={handleToggleComparisonSelector}
            className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition"
          >
            <GitCompare className="w-4 h-4" />
            {showComparisonSelector ? 'Hide Comparison' : 'Compare RFPs'}
          </button>
          <Link
            href="/dashboard/portfolio/insights"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <TrendingUp className="w-4 h-4" />
            Portfolio Insights
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* ================================================================
          SECTION 1B: MULTI-RFP COMPARISON SELECTOR (STEP 49)
          ================================================================ */}
      {showComparisonSelector && (
        <div className="bg-white border border-fuchsia-200 rounded-lg p-6 shadow-sm" data-demo="multi-rfp-comparison">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select RFPs to Compare</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose 2-5 RFPs for side-by-side comparison (selected: {selectedRfpIds.size})
              </p>
            </div>
            <button
              onClick={handleCompareRfps}
              disabled={selectedRfpIds.size < 2 || selectedRfpIds.size > 5}
              className="flex items-center gap-2 px-6 py-3 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitCompare className="w-5 h-5" />
              Compare Selected ({selectedRfpIds.size})
            </button>
          </div>

          {loadingRfpList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-fuchsia-600" />
            </div>
          ) : rfpList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No active RFPs available for comparison
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rfpList.map((rfp) => (
                <label
                  key={rfp.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${
                    selectedRfpIds.has(rfp.id)
                      ? 'border-fuchsia-500 bg-fuchsia-50'
                      : 'border-gray-200 hover:border-fuchsia-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRfpIds.has(rfp.id)}
                    onChange={() => handleToggleRfpSelection(rfp.id)}
                    className="w-5 h-5 text-fuchsia-600 rounded border-gray-300 focus:ring-fuchsia-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{rfp.title}</h3>
                      <span className="text-sm text-gray-500">
                        {STAGE_LABELS[rfp.stage] || rfp.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Status: {rfp.status}</span>
                      {rfp.budget && <span>Budget: ${rfp.budget.toLocaleString()}</span>}
                      <span>Created: {new Date(rfp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          SECTION 2: KPI ROW
          ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6" data-demo="portfolio-kpis">
        {/* Total RFPs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-600">Total RFPs</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.totalRfps}</p>
          <p className="text-xs text-gray-500 mt-1">Across all stages</p>
        </div>

        {/* Active RFPs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-600">Active RFPs</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.activeRfps}</p>
          <p className="text-xs text-gray-500 mt-1">Not yet awarded</p>
        </div>

        {/* Awarded RFPs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-gray-600">Awarded RFPs</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.awardedRfps}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>

        {/* Total Potential Spend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h3 className="text-sm font-medium text-gray-600">Total Budget</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${spendSummary.totalBudgetAllRfps.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">All RFPs</p>
        </div>

        {/* In-Flight Budget */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-600">In-Flight</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${spendSummary.inFlightBudget.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Not yet awarded</p>
        </div>
      </div>

      {/* ================================================================
          SECTION 3: STAGE DISTRIBUTION
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-demo="portfolio-stages">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">RFPs by Stage</h2>
        {stages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No RFPs in pipeline</p>
        ) : (
          <div className="space-y-4">
            {stages.map((stage: any) => (
              <div key={stage.stage} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {STAGE_LABELS[stage.stage] || stage.stage}
                  </h3>
                  <span className="text-sm font-semibold text-indigo-600">
                    {stage.count} RFP{stage.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Total Budget: ${stage.totalBudget.toLocaleString()}</span>
                  <span>Active: {stage.activeRfps}</span>
                </div>
                {stage.exampleRfpTitles.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Examples: {stage.exampleRfpTitles.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION 4: RISK & READINESS
          ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-demo="portfolio-risk-readiness">
        {/* Risk Bands */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Bands</h2>
          <div className="space-y-3">
            {riskBands.map((band: any) => (
              <div
                key={band.band}
                className={`border rounded-lg p-4 ${
                  band.band === 'low' ? 'border-green-300 bg-green-50' :
                  band.band === 'medium' ? 'border-amber-300 bg-amber-50' :
                  'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold uppercase ${
                    band.band === 'low' ? 'text-green-700' :
                    band.band === 'medium' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {band.band} Risk
                  </span>
                  <span className="text-sm text-gray-700">{band.rfps} RFPs</span>
                </div>
                <p className="text-xs text-gray-600">Suppliers: {band.suppliers}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Readiness Distribution</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-medium text-green-700">Excellent (≥90)</span>
              <span className="text-sm font-semibold text-green-900">{readinessDistribution.excellentCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Good (75-89)</span>
              <span className="text-sm font-semibold text-blue-900">{readinessDistribution.goodCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-sm font-medium text-amber-700">Moderate (60-74)</span>
              <span className="text-sm font-semibold text-amber-900">{readinessDistribution.moderateCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-medium text-red-700">Low (&lt;60)</span>
              <span className="text-sm font-semibold text-red-900">{readinessDistribution.lowCount}</span>
            </div>
            {readinessDistribution.averageReadiness && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Average Readiness: <span className="font-semibold">{readinessDistribution.averageReadiness.toFixed(1)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 5: TOP SUPPLIERS
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-demo="portfolio-top-suppliers">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Suppliers Across Portfolio</h2>
        {topSuppliers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No supplier data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Supplier</th>
                  <th className="pb-3 font-medium">Organization</th>
                  <th className="pb-3 font-medium text-center">RFPs</th>
                  <th className="pb-3 font-medium text-center">Wins</th>
                  <th className="pb-3 font-medium text-center">Avg Score</th>
                  <th className="pb-3 font-medium text-center">Avg Readiness</th>
                  <th className="pb-3 font-medium text-center">Reliability</th>
                  <th className="pb-3 font-medium">Tier</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliers.map((supplier: any) => (
                  <tr key={supplier.supplierId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <Link
                        href={`/dashboard/suppliers/${supplier.supplierId}/scorecard`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {supplier.supplierName}
                      </Link>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{supplier.organization || '—'}</td>
                    <td className="py-3 text-center text-sm text-gray-900">{supplier.totalRfpsParticipated}</td>
                    <td className="py-3 text-center text-sm text-gray-900">{supplier.totalWins}</td>
                    <td className="py-3 text-center text-sm text-gray-900">
                      {supplier.avgFinalScore ? supplier.avgFinalScore.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 text-center text-sm text-gray-900">
                      {supplier.avgReadiness ? supplier.avgReadiness.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 text-center text-sm text-gray-900">
                      {supplier.reliabilityIndex ? `${supplier.reliabilityIndex.toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        supplier.headlinePerformanceTier === 'strategic' ? 'bg-green-100 text-green-800' :
                        supplier.headlinePerformanceTier === 'preferred' ? 'bg-blue-100 text-blue-800' :
                        supplier.headlinePerformanceTier === 'opportunistic' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.headlinePerformanceTier || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION 6: UPCOMING MILESTONES
          ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-demo="portfolio-milestones">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Milestones</h2>
        {upcomingMilestones.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming milestones in the next 30 days</p>
        ) : (
          <div className="space-y-3">
            {upcomingMilestones.map((milestone: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{milestone.milestone}</p>
                    <Link
                      href={`/dashboard/rfps/${milestone.rfpId}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {milestone.rfpTitle}
                    </Link>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(milestone.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION 7: OPTION 3 TEASER
          ================================================================ */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Award className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlock Advanced Portfolio Analytics (Option 3)
            </h3>
            <p className="text-gray-700 mb-3">
              Portfolio forecasting, scenario planning, and portfolio-level decision briefs are available as an Option 3 upgrade.
            </p>
            <ul className="space-y-1 text-sm text-gray-600 mb-4">
              <li>• Predictive RFP cycle time forecasting</li>
              <li>• Portfolio-level decision briefs across multiple RFPs</li>
              <li>• "What-if" scenario planning</li>
              <li>• External market benchmark overlays</li>
              <li>• Portfolio risk heatmaps and trend charts</li>
            </ul>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
              Learn More About Option 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
