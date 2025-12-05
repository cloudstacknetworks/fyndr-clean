'use client';

/**
 * STEP 59: Auto-Scoring Workspace Client Component
 * 
 * Comprehensive UI for running auto-scoring, viewing results, and managing buyer overrides
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Brain,
  Loader2,
} from 'lucide-react';

interface SupplierContact {
  id: string;
  name: string;
  email: string;
  organization: string | null;
}

interface SupplierResponse {
  id: string;
  supplierContactId: string;
  supplierContact: SupplierContact;
  autoScoreJson: any;
  autoScoreGeneratedAt: Date | null;
  structuredAnswers: any;
}

interface RFP {
  id: string;
  title: string;
  scoringMatrixSnapshot: any;
  allowAiScoring: boolean;
  scoringSettingsJson: any;
}

interface Props {
  rfp: RFP;
  supplierResponses: SupplierResponse[];
}

export default function ScoringWorkspaceClient({ rfp, supplierResponses: initialResponses }: Props) {
  const router = useRouter();
  const [supplierResponses, setSupplierResponses] = useState<SupplierResponse[]>(initialResponses);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set());
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [currentOverride, setCurrentOverride] = useState<{
    supplierId: string;
    requirementId: string;
    currentScore: number;
    autoScore: number;
  } | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Run auto-scoring for all suppliers
  const handleRunAutoScoring = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/rfps/${rfp.id}/auto-score/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run auto-scoring');
      }

      showToast('Auto-scoring completed successfully!', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error running auto-scoring:', error);
      showToast(error instanceof Error ? error.message : 'Failed to run auto-scoring', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate all scores
  const handleRegenerateScores = async () => {
    const confirmed = confirm(
      'This will regenerate all auto-scores while preserving buyer overrides. Continue?'
    );

    if (!confirmed) return;

    setRegenerating(true);
    try {
      const response = await fetch(`/api/dashboard/rfps/${rfp.id}/auto-score/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate scores');
      }

      showToast('Scores regenerated successfully!', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error regenerating scores:', error);
      showToast(error instanceof Error ? error.message : 'Failed to regenerate scores', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  // Open override modal
  const openOverrideModal = (
    supplierId: string,
    requirementId: string,
    currentScore: number,
    autoScore: number
  ) => {
    setCurrentOverride({ supplierId, requirementId, currentScore, autoScore });
    setOverrideScore(currentScore);
    setOverrideReason('');
    setOverrideModalOpen(true);
  };

  // Save override
  const handleSaveOverride = async () => {
    if (!currentOverride) return;

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfp.id}/auto-score/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: currentOverride.supplierId,
          requirementId: currentOverride.requirementId,
          overrideScore,
          overrideReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save override');
      }

      showToast('Override saved successfully!', 'success');
      setOverrideModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving override:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save override', 'error');
    }
  };

  // Remove override
  const handleRemoveOverride = async (supplierId: string, requirementId: string) => {
    const confirmed = confirm('Are you sure you want to remove this override?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfp.id}/auto-score/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          requirementId,
          removeOverride: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove override');
      }

      showToast('Override removed successfully!', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error removing override:', error);
      showToast(error instanceof Error ? error.message : 'Failed to remove override', 'error');
    }
  };

  // Toggle supplier expansion
  const toggleSupplier = (supplierId: string) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId);
    } else {
      newExpanded.add(supplierId);
    }
    setExpandedSuppliers(newExpanded);
  };

  // Toggle AI reasoning expansion
  const toggleReasoning = (key: string) => {
    const newExpanded = new Set(expandedReasonings);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedReasonings(newExpanded);
  };

  // Calculate overall score for a supplier
  const calculateOverallScore = (scores: any[]) => {
    if (!scores || scores.length === 0) return 0;
    const totalWeighted = scores.reduce((sum, score) => {
      const finalScore = score.buyerOverride
        ? score.buyerOverride.overrideScore * (score.weight / 100)
        : score.autoScore.weightedScore;
      return sum + finalScore;
    }, 0);
    return totalWeighted;
  };

  // Get scoring method badge color
  const getScoringMethodColor = (method: string) => {
    switch (method) {
      case 'numeric':
        return 'bg-blue-100 text-blue-700';
      case 'weighted':
        return 'bg-purple-100 text-purple-700';
      case 'pass_fail':
        return 'bg-green-100 text-green-700';
      case 'ai_semantic':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto-Scoring Workspace</h1>
        <p className="text-gray-600">
          {rfp.title} • {supplierResponses.length} supplier{supplierResponses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleRunAutoScoring}
          disabled={loading || regenerating}
          data-demo="auto-scoring-button"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Calculator className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Running...' : 'Run Auto-Scoring'}
        </button>

        <button
          onClick={handleRegenerateScores}
          disabled={loading || regenerating}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {regenerating ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 mr-2" />
          )}
          {regenerating ? 'Regenerating...' : 'Regenerate All Scores'}
        </button>
      </div>

      {/* Empty State */}
      {supplierResponses.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Supplier Responses Yet</h3>
          <p className="text-gray-600">
            Supplier responses will appear here once they submit their proposals.
          </p>
        </div>
      )}

      {/* Supplier Scoring Display */}
      {supplierResponses.map((response) => {
        const scores = response.autoScoreJson as any[];
        const overallScore = calculateOverallScore(scores);
        const isExpanded = expandedSuppliers.has(response.supplierContactId);

        return (
          <div key={response.id} className="mb-6 bg-white rounded-lg shadow" data-demo="auto-scoring-results">
            {/* Supplier Header */}
            <div
              className="p-6 border-b cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSupplier(response.supplierContactId)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {response.supplierContact.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {response.supplierContact.organization} • {response.supplierContact.email}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {overallScore.toFixed(1)}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-6">
                {!scores || scores.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No scoring data yet. Run auto-scoring to generate scores.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {scores.map((score: any) => {
                      const reasoningKey = `${response.id}-${score.requirementId}`;
                      const isReasoningExpanded = expandedReasonings.has(reasoningKey);
                      const hasOverride = !!score.buyerOverride;
                      const finalScore = hasOverride
                        ? score.buyerOverride.overrideScore
                        : score.autoScore.rawScore;

                      return (
                        <div key={score.requirementId} className="border rounded-lg p-4 bg-gray-50">
                          {/* Requirement Question */}
                          <h4 className="font-semibold text-gray-900 mb-2">{score.question}</h4>

                          {/* Supplier Response Text */}
                          <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-1">Supplier Response:</div>
                            <div className="text-sm text-gray-800 bg-white p-3 rounded border">
                              {score.supplierResponseText
                                ? score.supplierResponseText.length > 200
                                  ? `${score.supplierResponseText.substring(0, 200)}...`
                                  : score.supplierResponseText
                                : 'No response provided'}
                            </div>
                          </div>

                          {/* Auto-Score Section */}
                          <div className="mb-4 p-4 bg-white rounded border">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900">Auto-Score</h5>
                              <span
                                className={`px-2 py-1 text-xs rounded ${getScoringMethodColor(
                                  score.autoScore.scoringMethod
                                )}`}
                              >
                                {score.autoScore.scoringMethod}
                              </span>
                            </div>

                            {/* Raw Score Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Raw Score</span>
                                <span className="font-semibold text-gray-900">
                                  {score.autoScore.rawScore}/100
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${score.autoScore.rawScore}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Weighted Score */}
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Weighted Score</span>
                              <span className="font-semibold text-gray-900">
                                {score.autoScore.weightedScore.toFixed(2)} (Weight: {score.weight}%)
                              </span>
                            </div>

                            {/* Must-Have Failure Warning */}
                            {score.autoScore.failedMustHave && (
                              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded mb-3">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-700 font-medium">
                                  Failed Must-Have Requirement
                                </span>
                              </div>
                            )}

                            {/* AI Reasoning (Collapsible) */}
                            {score.autoScore.aiReasoning && (
                              <div className="mt-3" data-demo="auto-scoring-ai-reasoning">
                                <button
                                  onClick={() => toggleReasoning(reasoningKey)}
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  <Brain className="w-4 h-4" />
                                  {isReasoningExpanded ? 'Hide' : 'Show'} AI Reasoning
                                  {isReasoningExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>

                                {isReasoningExpanded && (
                                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded">
                                    <p className="text-sm text-gray-700 mb-2">
                                      {score.autoScore.aiReasoning}
                                    </p>
                                    {score.autoScore.aiConfidence !== undefined && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600">Confidence:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                          <div
                                            className="bg-orange-500 h-1.5 rounded-full"
                                            style={{
                                              width: `${score.autoScore.aiConfidence * 100}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-900">
                                          {(score.autoScore.aiConfidence * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Generated Timestamp */}
                            <div className="text-xs text-gray-500 mt-2">
                              Generated: {new Date(score.autoScore.generatedAt).toLocaleString()}
                            </div>
                          </div>

                          {/* Buyer Override Section */}
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                            {hasOverride ? (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-yellow-600" />
                                    <span className="font-medium text-yellow-900">
                                      Buyer Override Applied
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        openOverrideModal(
                                          response.supplierContactId,
                                          score.requirementId,
                                          score.buyerOverride.overrideScore,
                                          score.autoScore.rawScore
                                        )
                                      }
                                      className="p-2 text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                                      title="Edit Override"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRemoveOverride(
                                          response.supplierContactId,
                                          score.requirementId
                                        )
                                      }
                                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                      title="Remove Override"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Override Details */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Override Score:</span>
                                    <span className="font-semibold text-gray-900">
                                      {score.buyerOverride.overrideScore}/100
                                    </span>
                                  </div>
                                  {score.buyerOverride.overrideReason && (
                                    <div>
                                      <span className="text-gray-600">Reason:</span>
                                      <p className="text-gray-800 mt-1">
                                        {score.buyerOverride.overrideReason}
                                      </p>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Overridden:{' '}
                                    {new Date(score.buyerOverride.overriddenAt).toLocaleString()}
                                  </div>
                                </div>

                                {/* Visual Comparison */}
                                <div className="mt-3 pt-3 border-t border-yellow-300">
                                  <div className="text-xs font-medium text-gray-700 mb-2">
                                    Score Comparison
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="flex-1">
                                      <div className="text-xs text-gray-600 mb-1">Auto-Score</div>
                                      <div className="text-lg font-semibold text-blue-600">
                                        {score.autoScore.rawScore}
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <TrendingUp className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1 text-right">
                                      <div className="text-xs text-gray-600 mb-1">Override</div>
                                      <div className="text-lg font-semibold text-yellow-600">
                                        {score.buyerOverride.overrideScore}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <span
                                      className={`text-sm font-medium ${
                                        score.buyerOverride.overrideScore >
                                        score.autoScore.rawScore
                                          ? 'text-green-600'
                                          : score.buyerOverride.overrideScore <
                                            score.autoScore.rawScore
                                          ? 'text-red-600'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      Delta:{' '}
                                      {score.buyerOverride.overrideScore > score.autoScore.rawScore
                                        ? '+'
                                        : ''}
                                      {score.buyerOverride.overrideScore - score.autoScore.rawScore}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  openOverrideModal(
                                    response.supplierContactId,
                                    score.requirementId,
                                    score.autoScore.rawScore,
                                    score.autoScore.rawScore
                                  )
                                }
                                className="w-full py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors font-medium"
                              >
                                Override Score
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Override Modal */}
      {overrideModalOpen && currentOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Override Score</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Override Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={overrideScore}
                onChange={(e) => setOverrideScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional but recommended)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain why you're overriding this score..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveOverride}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Override
              </button>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
