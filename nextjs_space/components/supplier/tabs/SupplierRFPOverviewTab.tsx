'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Tab Component: Overview
 */

import Link from 'next/link';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface SupplierRFPOverviewTabProps {
  rfpId: string;
  summary: any;
}

export default function SupplierRFPOverviewTab({ rfpId, summary }: SupplierRFPOverviewTabProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const progressPercentage = summary.totalRequirements > 0
    ? Math.round((summary.answeredRequirements / summary.totalRequirements) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Description */}
      {summary.description && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Description
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {summary.description}
          </p>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Requirements answered
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {summary.answeredRequirements} / {summary.totalRequirements} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.uploadedDocumentsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Documents uploaded
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <QuestionMarkCircleIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.unansweredQuestionsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Unanswered questions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.supplierStatus}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Current status
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Dates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.qnaEndDate && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Q&A Period Ends
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(summary.qnaEndDate)}
                </div>
              </div>
            </div>
          )}

          {summary.submissionDeadline && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Submission Deadline
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(summary.submissionDeadline)}
                </div>
              </div>
            </div>
          )}

          {summary.demoWindowStart && summary.demoWindowEnd && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Demo Window
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(summary.demoWindowStart)} - {formatDate(summary.demoWindowEnd)}
                </div>
              </div>
            </div>
          )}

          {summary.invitedAt && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Invited On
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(summary.invitedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/dashboard/supplier/rfps/${rfpId}?tab=requirements`}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                View Requirements
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Answer questions
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            href={`/dashboard/supplier/rfps/${rfpId}?tab=documents`}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Upload Documents
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Attach files
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            href={`/dashboard/supplier/rfps/${rfpId}?tab=qa`}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                View Q&A
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ask questions
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
