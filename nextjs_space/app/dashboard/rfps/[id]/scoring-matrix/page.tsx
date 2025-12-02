/**
 * STEP 39: Requirement-Level Scoring Matrix - UI Component
 * 
 * This page displays the requirement-level scoring matrix for an RFP,
 * showing how each supplier scores on each requirement.
 * 
 * Features:
 * - Tabular matrix view (requirements × suppliers)
 * - Category filtering
 * - Search and filter controls
 * - Export to CSV
 * - Supplier summary cards
 * - Recompute functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
  Shield,
  DollarSign,
  Settings as SettingsIcon,
  Briefcase,
  FileText,
} from 'lucide-react';
import {
  ScoringMatrixSnapshot,
  RequirementCategoryId,
  RequirementScoreLevel,
  MatrixFilters,
} from '@/lib/comparison/scoring-matrix-types';

// Category icons mapping
const CATEGORY_ICONS: Record<RequirementCategoryId, any> = {
  functional: TrendingUp,
  commercial: DollarSign,
  legal: FileText,
  security: Shield,
  operational: SettingsIcon,
  other: Briefcase,
};

// Score level styling
const SCORE_LEVEL_STYLES: Record<RequirementScoreLevel, { bg: string; text: string; icon: any }> = {
  pass: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  partial: { bg: 'bg-amber-100', text: 'text-amber-700', icon: MinusCircle },
  fail: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  not_applicable: { bg: 'bg-gray-100', text: 'text-gray-500', icon: HelpCircle },
  missing: { bg: 'bg-gray-50', text: 'text-gray-400', icon: AlertCircle },
};

export default function ScoringMatrixPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const rfpId = params.id;

  // State
  const [matrix, setMatrix] = useState<ScoringMatrixSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<MatrixFilters>({
    category: 'all',
    onlyDifferentiators: false,
    onlyFailedOrPartial: false,
    searchTerm: '',
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'matrix' | 'summaries'>('matrix');

  // Fetch matrix on mount
  useEffect(() => {
    fetchMatrix();
  }, [rfpId]);

  // Fetch matrix from API
  const fetchMatrix = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/rfps/${rfpId}/comparison/matrix`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch scoring matrix');
      }

      const data = await response.json();
      setMatrix(data.matrix);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Recompute matrix
  const handleRecompute = async () => {
    try {
      setRecomputing(true);
      setError(null);

      const response = await fetch(`/api/dashboard/rfps/${rfpId}/comparison/matrix/recompute`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recompute matrix');
      }

      const data = await response.json();
      setMatrix(data.matrix);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRecomputing(false);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      const queryParams = new URLSearchParams({
        category: filters.category || 'all',
        onlyDifferentiators: filters.onlyDifferentiators ? 'true' : 'false',
        onlyFailedOrPartial: filters.onlyFailedOrPartial ? 'true' : 'false',
        searchTerm: filters.searchTerm || '',
      });

      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/comparison/matrix/export?${queryParams}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export matrix');
      }

      // Download CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scoring-matrix-${rfpId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // Apply client-side filters
  const applyFilters = () => {
    if (!matrix) return { requirements: [], cells: [] };

    let filteredRequirements = [...matrix.requirements];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filteredRequirements = filteredRequirements.filter(r => r.category === filters.category);
    }

    // Differentiators filter
    if (filters.onlyDifferentiators) {
      filteredRequirements = filteredRequirements.filter(req => {
        const reqCells = matrix.cells.filter(c => c.requirementId === req.requirementId);
        const uniqueScores = new Set(reqCells.map(c => c.scoreLevel));
        return uniqueScores.size > 1;
      });
    }

    // Failed or partial filter
    if (filters.onlyFailedOrPartial) {
      filteredRequirements = filteredRequirements.filter(req => {
        const reqCells = matrix.cells.filter(c => c.requirementId === req.requirementId);
        return reqCells.some(c => c.scoreLevel === 'fail' || c.scoreLevel === 'partial');
      });
    }

    // Search term
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      filteredRequirements = filteredRequirements.filter(r =>
        r.shortLabel.toLowerCase().includes(term) ||
        r.longDescription.toLowerCase().includes(term) ||
        r.referenceKey.toLowerCase().includes(term)
      );
    }

    const filteredCells = matrix.cells.filter(c =>
      filteredRequirements.some(r => r.requirementId === c.requirementId)
    );

    return { requirements: filteredRequirements, cells: filteredCells };
  };

  const { requirements: filteredRequirements, cells: filteredCells } = applyFilters();

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scoring matrix...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !matrix) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Matrix</h2>
          <p className="text-gray-600 mb-4">{error || 'No matrix data found'}</p>
          <button
            onClick={fetchMatrix}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Requirement-Level Scoring Matrix</h1>
              <p className="text-sm text-gray-600 mt-1">
                {matrix.meta.totalRequirements} requirements × {matrix.meta.totalSuppliers} suppliers
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </button>

              <button
                onClick={handleRecompute}
                disabled={recomputing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {recomputing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recompute
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-200">
            <button
              onClick={() => setSelectedTab('matrix')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                selectedTab === 'matrix'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Matrix View
            </button>
            <button
              onClick={() => setSelectedTab('summaries')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                selectedTab === 'summaries'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Supplier Summaries
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category || 'all'}
                  onChange={e => setFilters({ ...filters, category: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="functional">Functional</option>
                  <option value="commercial">Commercial</option>
                  <option value="legal">Legal</option>
                  <option value="security">Security</option>
                  <option value="operational">Operational</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.searchTerm || ''}
                    onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
                    placeholder="Search requirements..."
                    className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Toggle Filters */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.onlyDifferentiators || false}
                    onChange={e =>
                      setFilters({ ...filters, onlyDifferentiators: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Only Differentiators</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.onlyFailedOrPartial || false}
                    onChange={e =>
                      setFilters({ ...filters, onlyFailedOrPartial: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Only Failed/Partial</span>
                </label>
              </div>

              {/* Reset */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({
                      category: 'all',
                      onlyDifferentiators: false,
                      onlyFailedOrPartial: false,
                      searchTerm: '',
                    })
                  }
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedTab === 'matrix' ? (
          <MatrixView
            requirements={filteredRequirements}
            cells={filteredCells}
            suppliers={matrix.supplierSummaries}
          />
        ) : (
          <SummariesView suppliers={matrix.supplierSummaries} />
        )}
      </div>
    </div>
  );
}

// Matrix View Component
function MatrixView({ requirements, cells, suppliers }: any) {
  if (requirements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No requirements match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Requirement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importance
              </th>
              {suppliers.map((supplier: any) => (
                <th
                  key={supplier.supplierId}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {supplier.supplierName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requirements.map((req: any) => {
              const Icon = CATEGORY_ICONS[req.category as RequirementCategoryId] || Briefcase;
              return (
                <tr key={req.requirementId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 sticky left-0 bg-white z-10">
                    <div className="max-w-xs">
                      <div className="font-medium">{req.shortLabel}</div>
                      <div className="text-gray-500 text-xs mt-1">{req.referenceKey}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                      {req.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        req.importance === 'must_have'
                          ? 'bg-red-100 text-red-700'
                          : req.importance === 'should_have'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {req.importance.replace('_', ' ')}
                    </span>
                  </td>
                  {suppliers.map((supplier: any) => {
                    const cell = cells.find(
                      (c: any) =>
                        c.requirementId === req.requirementId && c.supplierId === supplier.supplierId
                    );
                    const scoreLevel = (cell?.scoreLevel || 'missing') as RequirementScoreLevel;
                    const style = SCORE_LEVEL_STYLES[scoreLevel];
                    const ScoreIcon = style.icon;
                    return (
                      <td key={supplier.supplierId} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}
                            title={cell?.justification || ''}
                          >
                            <ScoreIcon className="h-3 w-3 mr-1" />
                            {cell?.scoreLevel || 'missing'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Summaries View Component
function SummariesView({ suppliers }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {suppliers.map((supplier: any) => (
        <div key={supplier.supplierId} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{supplier.supplierName}</h3>

          {/* Overall Scores */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Score</span>
              <span className="text-lg font-bold text-gray-900">{supplier.overallScore}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Weighted Score</span>
              <span className="text-lg font-bold text-indigo-600">{supplier.weightedScore}%</span>
            </div>
          </div>

          {/* Must-Have Compliance */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Must-Have Compliance</h4>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">
                {supplier.mustHaveCompliance.passed} / {supplier.mustHaveCompliance.total} passed
              </span>
            </div>
            {supplier.mustHaveCompliance.failed > 0 && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">{supplier.mustHaveCompliance.failed} failed</span>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Category Breakdown</h4>
            <div className="space-y-2">
              {supplier.categoryScores.map((cat: any) => {
                const Icon = CATEGORY_ICONS[cat.category as RequirementCategoryId] || Briefcase;
                return (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                      <span className="text-gray-600 capitalize">{cat.category}</span>
                    </div>
                    <span className="font-medium text-gray-900">{Math.round(cat.score)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
