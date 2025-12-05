/**
 * STEP 61: Buyer Evaluation Workspace - Main Page
 * 
 * Complete evaluation workspace for buyers to score supplier responses,
 * override AI scores, add comments, and track variance
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import ScoringTable from '@/app/components/evaluation/ScoringTable';
import OverrideModal from '@/app/components/evaluation/OverrideModal';
import CommentDrawer from '@/app/components/evaluation/CommentDrawer';
import { EvaluationWorkspaceData, ScoringItem } from '@/lib/evaluation/evaluation-engine';

export default function EvaluationWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const rfpId = params.id as string;
  const supplierId = params.supplierId as string;

  const [workspaceData, setWorkspaceData] = useState<EvaluationWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<ScoringItem | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);

  // Load workspace data
  useEffect(() => {
    loadWorkspaceData();
  }, [rfpId, supplierId]);

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/evaluation/${supplierId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load workspace data');
      }

      const data = await response.json();
      setWorkspaceData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOverride = async (
    requirementId: string,
    score: number,
    justification: string
  ) => {
    try {
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/evaluation/${supplierId}/override`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirementId, score, justification }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save override');
      }

      // Reload workspace data
      await loadWorkspaceData();
    } catch (err: any) {
      throw err;
    }
  };

  const handleClearOverride = async (requirementId: string) => {
    try {
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/evaluation/${supplierId}/override/clear`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirementId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear override');
      }

      // Reload workspace data
      await loadWorkspaceData();
    } catch (err: any) {
      throw err;
    }
  };

  const handleAddComment = async (requirementId: string, commentText: string) => {
    try {
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/evaluation/${supplierId}/comment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirementId, commentText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }

      // Reload workspace data
      await loadWorkspaceData();
    } catch (err: any) {
      throw err;
    }
  };

  const handleExportPDF = async () => {
    window.open(`/api/dashboard/rfps/${rfpId}/evaluation/${supplierId}/export/pdf`, '_blank');
  };

  const handleExportDOCX = async () => {
    window.open(`/api/dashboard/rfps/${rfpId}/evaluation/${supplierId}/export/docx`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!workspaceData) return null;

  const { rfp, supplier, summary, scoringItems } = workspaceData;

  return (
    <div className="min-h-screen bg-gray-50" data-demo="evaluation-workspace">
      {/* Header Section */}
      <div className="border-b bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <button
              onClick={() => router.push(`/dashboard/rfps/${rfpId}/compare`)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Supplier Comparison
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {supplier.name} - Evaluation
              </h1>
              <p className="text-gray-600 mt-1">{rfp.title}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Score</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalOverrideScore.toFixed(0)}/100
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Weighted Score</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalWeightedOverrideScore.toFixed(0)}/100
                </div>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-2 mb-4">
            {summary.mustHaveFailures > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-800 font-medium">
                ⚠ {summary.mustHaveFailures} Must-Have Failure{summary.mustHaveFailures > 1 ? 's' : ''}
              </span>
            )}
            {summary.missingResponses > 0 && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 font-medium">
                ⚠ {summary.missingResponses} Missing Response{summary.missingResponses > 1 ? 's' : ''}
              </span>
            )}
            {summary.averageVariance > 3 && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800 font-medium">
                ⚠ High Scoring Variance
              </span>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2" data-demo="export-buttons">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export PDF
            </button>
            <button
              onClick={handleExportDOCX}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export DOCX
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scoring Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Scoring Matrix</h2>
              </div>
              <div className="p-4">
                <ScoringTable
                  scoringItems={scoringItems}
                  onOpenOverrideModal={(item) => {
                    setSelectedItem(item);
                    setIsOverrideModalOpen(true);
                  }}
                  onOpenCommentDrawer={(item) => {
                    setSelectedItem(item);
                    setIsCommentDrawerOpen(true);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Evaluation Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Score:</span>
                  <span className="font-semibold">{summary.totalOverrideScore.toFixed(0)}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weighted Score:</span>
                  <span className="font-semibold">{summary.totalWeightedOverrideScore.toFixed(0)}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overrides:</span>
                  <span className="font-semibold">{summary.overrideCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comments:</span>
                  <span className="font-semibold">{summary.commentCount}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">Flags</h4>
                <div className="space-y-2">
                  {summary.mustHaveFailures > 0 && (
                    <div className="text-sm text-red-600">
                      ⚠ {summary.mustHaveFailures} Must-Have Failure{summary.mustHaveFailures > 1 ? 's' : ''}
                    </div>
                  )}
                  {summary.missingResponses > 0 && (
                    <div className="text-sm text-yellow-600">
                      ⚠ {summary.missingResponses} Missing Response{summary.missingResponses > 1 ? 's' : ''}
                    </div>
                  )}
                  {summary.averageVariance > 3 && (
                    <div className="text-sm text-orange-600">
                      ⚠ High Scoring Variance ({summary.averageVariance.toFixed(1)})
                    </div>
                  )}
                  {summary.mustHaveFailures === 0 &&
                    summary.missingResponses === 0 &&
                    summary.averageVariance <= 3 && (
                      <div className="text-sm text-green-600">✓ No critical issues</div>
                    )}
                </div>
              </div>

              <button
                onClick={() => router.push(`/dashboard/rfps/${rfpId}/compare`)}
                className="mt-6 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition"
              >
                Return to Supplier Comparison
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals and Drawers */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        scoringItem={selectedItem}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setSelectedItem(null);
        }}
        onSaveOverride={handleSaveOverride}
        onClearOverride={handleClearOverride}
      />

      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        scoringItem={selectedItem}
        onClose={() => {
          setIsCommentDrawerOpen(false);
          setSelectedItem(null);
        }}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
