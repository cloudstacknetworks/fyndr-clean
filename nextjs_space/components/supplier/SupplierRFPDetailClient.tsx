'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Client Component: Supplier RFP Detail workspace with 6 tabs
 */

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import SupplierRFPOverviewTab from './tabs/SupplierRFPOverviewTab';
import SupplierRFPRequirementsTab from './tabs/SupplierRFPRequirementsTab';
import SupplierRFPDocumentsTab from './tabs/SupplierRFPDocumentsTab';
import SupplierRFPQATab from './tabs/SupplierRFPQATab';
import SupplierRFPPreviewTab from './tabs/SupplierRFPPreviewTab';
import SupplierRFPOutcomeTab from './tabs/SupplierRFPOutcomeTab';

interface SupplierRFPDetailClientProps {
  rfpId: string;
  initialSummary: any;
}

type TabKey = 'overview' | 'requirements' | 'documents' | 'qa' | 'preview' | 'outcome';

export default function SupplierRFPDetailClient({
  rfpId,
  initialSummary
}: SupplierRFPDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [summary] = useState(initialSummary);

  // Calculate deadline countdown
  const getDeadlineInfo = () => {
    if (!summary.submissionDeadline) {
      return { text: 'Not specified', color: 'text-gray-500' };
    }

    const deadline = new Date(summary.submissionDeadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        text: `${Math.abs(daysRemaining)} days overdue`,
        color: 'text-red-600 dark:text-red-400'
      };
    }

    if (daysRemaining === 0) {
      return { text: 'Due today', color: 'text-amber-600 dark:text-amber-400' };
    }

    if (daysRemaining <= 3) {
      return {
        text: `${daysRemaining} days left`,
        color: 'text-amber-600 dark:text-amber-400'
      };
    }

    return {
      text: `${daysRemaining} days left`,
      color: 'text-green-600 dark:text-green-400'
    };
  };

  const deadlineInfo = getDeadlineInfo();

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get stage color
  const getStageColor = (stage: string) => {
    const colorMap: Record<string, string> = {
      'Invitation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Q&A': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Submission': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Evaluation': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Demo': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Award': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colorMap[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const tabs = [
    { key: 'overview' as TabKey, label: 'Overview' },
    { key: 'requirements' as TabKey, label: 'Requirements' },
    { key: 'documents' as TabKey, label: 'Documents' },
    { key: 'qa' as TabKey, label: 'Q&A' },
    { key: 'preview' as TabKey, label: 'Submission Preview' },
    { key: 'outcome' as TabKey, label: 'Outcome' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/dashboard/supplier/rfps"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to My RFPs
        </Link>
      </div>

      {/* Page header */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6"
        data-demo="supplier-rfp-overview"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {summary.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Buyer company */}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                {summary.buyerCompanyName}
              </div>

              {/* Stage */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                  summary.stage
                )}`}
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {summary.stage}
              </span>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex-shrink-0">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Submission Deadline
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(summary.submissionDeadline)}
              </div>
              <div className={`text-sm font-medium flex items-center justify-end gap-1 mt-1 ${deadlineInfo.color}`}>
                <ClockIcon className="h-4 w-4" />
                {deadlineInfo.text}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <SupplierRFPOverviewTab rfpId={rfpId} summary={summary} />
          )}
          {activeTab === 'requirements' && (
            <SupplierRFPRequirementsTab rfpId={rfpId} />
          )}
          {activeTab === 'documents' && (
            <SupplierRFPDocumentsTab rfpId={rfpId} />
          )}
          {activeTab === 'qa' && (
            <SupplierRFPQATab rfpId={rfpId} />
          )}
          {activeTab === 'preview' && (
            <div data-demo="supplier-rfp-preview-tab">
              <SupplierRFPPreviewTab rfpId={rfpId} />
            </div>
          )}
          {activeTab === 'outcome' && (
            <SupplierRFPOutcomeTab rfpId={rfpId} />
          )}
        </div>
      </div>
    </div>
  );
}
