'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Tab Component: Requirements
 */

import { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  DocumentIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Requirement {
  requirementId: string;
  title: string;
  category: string;
  subcategory: string | null;
  answered: boolean;
  hasUploadedDoc: boolean;
  lastUpdatedAt: string | null;
}

interface SupplierRFPRequirementsTabProps {
  rfpId: string;
}

export default function SupplierRFPRequirementsTab({ rfpId }: SupplierRFPRequirementsTabProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'answered' | 'unanswered'>('all');

  useEffect(() => {
    async function fetchRequirements() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/supplier/rfps/${rfpId}/requirements`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch requirements');
        }

        const result = await response.json();
        setRequirements(result.data || []);
      } catch (err) {
        console.error('Error fetching requirements:', err);
        setError('Failed to load requirements');
      } finally {
        setLoading(false);
      }
    }

    fetchRequirements();
  }, [rfpId]);

  // Group requirements by category
  const groupedRequirements = requirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, Requirement[]>);

  // Apply filter
  const filterRequirement = (req: Requirement) => {
    if (filterStatus === 'answered') return req.answered;
    if (filterStatus === 'unanswered') return !req.answered;
    return true;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  if (requirements.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No requirements defined for this RFP.</p>
      </div>
    );
  }

  const totalCount = requirements.length;
  const answeredCount = requirements.filter(r => r.answered).length;
  const unansweredCount = totalCount - answeredCount;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Requirements
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {answeredCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Answered
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {unansweredCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Not Answered
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter:
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('answered')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterStatus === 'answered'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Answered ({answeredCount})
          </button>
          <button
            onClick={() => setFilterStatus('unanswered')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              filterStatus === 'unanswered'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Not Answered ({unansweredCount})
          </button>
        </div>
      </div>

      {/* Requirements grouped by category */}
      <div className="space-y-6">
        {Object.entries(groupedRequirements).map(([category, reqs]) => {
          const filteredReqs = reqs.filter(filterRequirement);
          
          if (filteredReqs.length === 0) return null;

          return (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category}
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReqs.map((req) => (
                  <div
                    key={req.requirementId}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {req.answered ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                          )}
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">
                            {req.title}
                          </h4>
                        </div>

                        {req.subcategory && (
                          <div className="ml-9 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {req.subcategory}
                          </div>
                        )}

                        <div className="ml-9 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {req.hasUploadedDoc && (
                            <div className="flex items-center gap-1">
                              <DocumentIcon className="h-4 w-4" />
                              <span>Document attached</span>
                            </div>
                          )}
                          {req.lastUpdatedAt && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>Updated {formatDate(req.lastUpdatedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            req.answered
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {req.answered ? 'Answered' : 'Not Answered'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> To edit your answers, please use the main submission form. This view is for tracking your progress only.
        </p>
      </div>
    </div>
  );
}
