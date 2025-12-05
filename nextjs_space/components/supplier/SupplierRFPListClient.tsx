'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Client Component: Supplier RFP List with filters and table
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface SupplierRFP {
  rfpId: string;
  title: string;
  buyerCompanyName: string;
  stage: string;
  status: string;
  submissionDeadline: string | null;
  qnaEndDate: string | null;
  demoWindowStart: string | null;
  demoWindowEnd: string | null;
  supplierStatus: string;
  outcomeStatus: string | null;
  hasPendingQuestions: boolean;
  hasPendingUploads: boolean;
  isOverdue: boolean;
  invitedAt: string | null;
  submittedAt: string | null;
}

export default function SupplierRFPListClient() {
  const router = useRouter();
  const [rfps, setRfps] = useState<SupplierRFP[]>([]);
  const [filteredRfps, setFilteredRfps] = useState<SupplierRFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch RFPs
  useEffect(() => {
    async function fetchRFPs() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/supplier/rfps');
        
        if (!response.ok) {
          throw new Error('Failed to fetch RFPs');
        }

        const result = await response.json();
        setRfps(result.data || []);
        setFilteredRfps(result.data || []);
      } catch (err) {
        console.error('Error fetching RFPs:', err);
        setError('Failed to load RFPs. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchRFPs();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...rfps];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((rfp) => rfp.supplierStatus === statusFilter);
    }

    // Stage filter
    if (stageFilter !== 'All') {
      filtered = filtered.filter((rfp) => rfp.stage === stageFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rfp) =>
          rfp.title.toLowerCase().includes(query) ||
          rfp.buyerCompanyName.toLowerCase().includes(query)
      );
    }

    setFilteredRfps(filtered);
  }, [statusFilter, stageFilter, searchQuery, rfps]);

  // Handle row click
  const handleRowClick = (rfpId: string) => {
    router.push(`/dashboard/supplier/rfps/${rfpId}`);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format deadline with countdown
  const formatDeadline = (dateString: string | null, isOverdue: boolean) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    const now = new Date();
    const daysRemaining = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isOverdue) {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium">
          {formatDate(dateString)} (Overdue)
        </span>
      );
    }

    if (daysRemaining <= 3 && daysRemaining > 0) {
      return (
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          {formatDate(dateString)} ({daysRemaining}d left)
        </span>
      );
    }

    return formatDate(dateString);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Invited': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Submitted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Outcome Available': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Withdrawn': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  // Get outcome badge color
  const getOutcomeBadgeColor = (outcome: string | null) => {
    if (!outcome) return '';
    const colorMap: Record<string, string> = {
      'Awarded': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Not Selected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'In Review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Canceled': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colorMap[outcome] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search RFPs
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by RFP title or buyer company..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <label htmlFor="status-filter" className="sr-only">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Invited">Invited</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Outcome Available">Outcome Available</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="w-full lg:w-48">
            <label htmlFor="stage-filter" className="sr-only">
              Stage
            </label>
            <select
              id="stage-filter"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Stages</option>
              <option value="Invitation">Invitation</option>
              <option value="Q&A">Q&A</option>
              <option value="Submission">Submission</option>
              <option value="Evaluation">Evaluation</option>
              <option value="Demo">Demo</option>
              <option value="Award">Award</option>
            </select>
          </div>
        </div>

        {/* Active filters summary */}
        {(statusFilter !== 'All' || stageFilter !== 'All' || searchQuery.trim()) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FunnelIcon className="h-4 w-4" />
            <span>
              Showing {filteredRfps.length} of {rfps.length} RFPs
            </span>
            <button
              onClick={() => {
                setStatusFilter('All');
                setStageFilter('All');
                setSearchQuery('');
              }}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* RFP List/Table */}
      {filteredRfps.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {rfps.length === 0
              ? "You don't have any active RFPs yet."
              : 'No RFPs match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RFP Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submission Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRfps.map((rfp) => (
                  <tr
                    key={rfp.rfpId}
                    onClick={() => handleRowClick(rfp.rfpId)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rfp.title}
                      </div>
                      {rfp.hasPendingQuestions && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          • Pending questions
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {rfp.buyerCompanyName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {rfp.stage}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatDeadline(rfp.submissionDeadline, rfp.isOverdue)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          rfp.supplierStatus
                        )}`}
                      >
                        {rfp.supplierStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {rfp.outcomeStatus ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOutcomeBadgeColor(
                            rfp.outcomeStatus
                          )}`}
                        >
                          {rfp.outcomeStatus}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
