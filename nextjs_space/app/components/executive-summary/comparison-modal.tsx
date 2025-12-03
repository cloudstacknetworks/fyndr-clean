/**
 * STEP 46: Executive Summary Comparison Modal
 * 
 * Displays semantic diff between two Executive Summary versions
 * with AI-powered narrative analysis, scoring, and export options.
 */

'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfpId: string;
  summaryAId: string;
  summaryBId: string;
  versionA: number;
  versionB: number;
}

interface ComparisonResult {
  metadata: {
    summaryA: {
      version: number;
      tone: string;
      audience: string;
      updatedAt: string;
    };
    summaryB: {
      version: number;
      tone: string;
      audience: string;
      updatedAt: string;
    };
  };
  structuralDiff: {
    sectionsAdded: string[];
    sectionsRemoved: string[];
    sectionsModified: string[];
  };
  semanticDiff: {
    strengtheningChanges: string[];
    weakeningChanges: string[];
    riskShifts: string[];
    recommendationShifts: string[];
    omissionsDetected: string[];
    newInsightsAdded: string[];
  };
  AIComparisonNarrative: string;
  scoring: {
    overallChangeScore: number;
    narrativeShiftScore: number;
    riskShiftScore: number;
    recommendationShiftScore: number;
  };
}

export function ComparisonModal({
  isOpen,
  onClose,
  rfpId,
  summaryAId,
  summaryBId,
  versionA,
  versionB,
}: ComparisonModalProps) {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComparison();
    }
  }, [isOpen, summaryAId, summaryBId]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/rfps/${rfpId}/executive-summaries/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryAId, summaryBId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate comparison');
      }

      const data = await response.json();
      setComparison(data.comparison);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message);
      toast.error('Failed to generate comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const url = `/api/dashboard/rfps/${rfpId}/executive-summaries/compare/pdf?summaryAId=${summaryAId}&summaryBId=${summaryBId}`;
    window.open(url, '_blank');
    toast.success('Exporting comparison as PDF...');
  };

  const handleExportDocx = () => {
    const url = `/api/dashboard/rfps/${rfpId}/executive-summaries/compare/docx?summaryAId=${summaryAId}&summaryBId=${summaryBId}`;
    window.open(url, '_blank');
    toast.success('Exporting comparison as Word document...');
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-6xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-xl font-bold text-white flex items-center">
                        <SparklesIcon className="h-6 w-6 mr-2" />
                        Executive Summary Comparison
                      </Dialog.Title>
                      <p className="text-sm text-blue-100 mt-1">
                        Version {versionA} vs Version {versionB}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[80vh] overflow-y-auto">
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">Analyzing differences...</p>
                    </div>
                  )}

                  {error && (
                    <div className="mx-6 my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">Error: {error}</p>
                    </div>
                  )}

                  {comparison && (
                    <div className="p-6 space-y-6">
                      {/* Export Actions */}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleExportPDF}
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          data-demo="comparison-export-pdf"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                          Export PDF
                        </button>
                        <button
                          onClick={handleExportDocx}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                          Export Word
                        </button>
                      </div>

                      {/* Version Metadata */}
                      <div className="grid grid-cols-2 gap-4">
                        <VersionMetadataCard
                          title={`Version ${comparison.metadata.summaryA.version} (Baseline)`}
                          metadata={comparison.metadata.summaryA}
                        />
                        <VersionMetadataCard
                          title={`Version ${comparison.metadata.summaryB.version} (Comparison)`}
                          metadata={comparison.metadata.summaryB}
                        />
                      </div>

                      {/* AI Narrative */}
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
                          <SparklesIcon className="h-5 w-5 mr-2 text-amber-600" />
                          Executive Analysis
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {comparison.AIComparisonNarrative.split('\n\n').map((para, i) => (
                            <p key={i} className="mb-3 last:mb-0">{para}</p>
                          ))}
                        </div>
                      </div>

                      {/* Change Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                          Change Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <ScoreCard
                            label="Overall Change Impact"
                            score={comparison.scoring.overallChangeScore}
                          />
                          <ScoreCard
                            label="Narrative Shift"
                            score={comparison.scoring.narrativeShiftScore}
                          />
                          <ScoreCard
                            label="Risk Assessment Shift"
                            score={comparison.scoring.riskShiftScore}
                          />
                          <ScoreCard
                            label="Recommendation Shift"
                            score={comparison.scoring.recommendationShiftScore}
                          />
                        </div>
                      </div>

                      {/* Structural Differences */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                          Structural Differences
                        </h3>
                        <div className="space-y-4">
                          <ChangeList
                            title="Sections Added"
                            items={comparison.structuralDiff.sectionsAdded}
                            color="green"
                          />
                          <ChangeList
                            title="Sections Removed"
                            items={comparison.structuralDiff.sectionsRemoved}
                            color="red"
                          />
                          <ChangeList
                            title="Sections Modified"
                            items={comparison.structuralDiff.sectionsModified}
                            color="amber"
                          />
                        </div>
                      </div>

                      {/* Semantic Differences */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-600" />
                          Semantic Differences
                        </h3>
                        <div className="space-y-4">
                          <ChangeList
                            title="Strengthening Changes"
                            items={comparison.semanticDiff.strengtheningChanges}
                            icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
                            color="blue"
                          />
                          <ChangeList
                            title="Weakening Changes"
                            items={comparison.semanticDiff.weakeningChanges}
                            icon={<ArrowTrendingDownIcon className="h-5 w-5" />}
                            color="pink"
                          />
                          <ChangeList
                            title="Risk Shifts"
                            items={comparison.semanticDiff.riskShifts}
                            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                            color="red"
                          />
                          <ChangeList
                            title="Recommendation Shifts"
                            items={comparison.semanticDiff.recommendationShifts}
                            color="emerald"
                          />
                          <ChangeList
                            title="New Insights Added"
                            items={comparison.semanticDiff.newInsightsAdded}
                            color="green"
                          />
                          <ChangeList
                            title="Omissions Detected"
                            items={comparison.semanticDiff.omissionsDetected}
                            color="orange"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function VersionMetadataCard({ title, metadata }: { title: string; metadata: any }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-600 mb-3">{title}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Tone:</span>
          <span className="font-medium">{metadata.tone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Audience:</span>
          <span className="font-medium">{metadata.audience}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Updated:</span>
          <span className="font-medium">
            {new Date(metadata.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score > 70) return 'bg-red-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-lg font-bold text-gray-900">{score}/100</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ChangeList({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: string[];
  color: string;
  icon?: React.ReactNode;
}) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800' },
    red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-800' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-800' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800' },
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">
          No {title.toLowerCase()} detected
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className={`${classes.bg} ${classes.text} border-l-4 ${classes.border} p-3 rounded-r-lg text-sm`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
