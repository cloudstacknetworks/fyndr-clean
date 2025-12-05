'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Tab Component: Outcome
 */

import { useEffect, useState } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface OutcomeData {
  outcomeStatus: string | null;
  outcomeDate: string | null;
  simpleOutcomeMessage: string;
}

interface SupplierRFPOutcomeTabProps {
  rfpId: string;
}

export default function SupplierRFPOutcomeTab({ rfpId }: SupplierRFPOutcomeTabProps) {
  const [outcome, setOutcome] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOutcome() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/supplier/rfps/${rfpId}/outcome`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch outcome');
        }

        const result = await response.json();
        setOutcome(result.data);
      } catch (err) {
        console.error('Error fetching outcome:', err);
        setError('Failed to load outcome');
      } finally {
        setLoading(false);
      }
    }

    fetchOutcome();
  }, [rfpId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getOutcomeDisplay = (status: string | null) => {
    if (!status) {
      return {
        icon: <ClockIcon className="h-20 w-20" />,
        iconColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        title: 'Decision Pending',
        subtitle: 'The buyer is still reviewing submissions'
      };
    }

    switch (status) {
      case 'Awarded':
        return {
          icon: <CheckCircleIcon className="h-20 w-20" />,
          iconColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          title: '🎉 Congratulations!',
          subtitle: 'You have been selected for this RFP'
        };
      case 'Not Selected':
        return {
          icon: <XCircleIcon className="h-20 w-20" />,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Not Selected',
          subtitle: 'Your submission was not selected'
        };
      case 'In Review':
        return {
          icon: <ClockIcon className="h-20 w-20" />,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          title: 'Under Review',
          subtitle: 'Your submission is being evaluated'
        };
      case 'Canceled':
        return {
          icon: <XCircleIcon className="h-20 w-20" />,
          iconColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          title: 'RFP Canceled',
          subtitle: 'This opportunity was canceled by the buyer'
        };
      default:
        return {
          icon: <InformationCircleIcon className="h-20 w-20" />,
          iconColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          title: 'Status Unknown',
          subtitle: 'Please contact the buyer for more information'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !outcome) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error || 'Failed to load outcome'}</p>
      </div>
    );
  }

  const display = getOutcomeDisplay(outcome.outcomeStatus);

  return (
    <div className="space-y-6">
      {/* Main outcome card */}
      <div
        className={`${display.bgColor} border ${display.borderColor} rounded-lg p-12 text-center`}
      >
        <div className={`${display.iconColor} flex justify-center mb-6`}>
          {display.icon}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {display.title}
        </h2>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          {display.subtitle}
        </p>

        {outcome.outcomeDate && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <InformationCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Decision made on {formatDate(outcome.outcomeDate)}
            </span>
          </div>
        )}
      </div>

      {/* Outcome message */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Message
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {outcome.simpleOutcomeMessage}
        </p>
      </div>

      {/* Info notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>This outcome is based on the buyer&apos;s final decision</li>
              <li>Detailed scoring and evaluation criteria are not shown</li>
              <li>For questions about this decision, please contact the buyer directly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Thank you message */}
      {outcome.outcomeStatus && outcome.outcomeStatus !== 'In Review' && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            Thank you for your participation in this RFP process.
          </p>
        </div>
      )}
    </div>
  );
}
