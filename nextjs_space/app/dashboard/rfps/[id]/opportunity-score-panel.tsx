'use client';

/**
 * Opportunity Score Panel Component
 * STEP 13: Displays and manages RFP opportunity scores
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, AlertCircle, Edit3 } from 'lucide-react';
import {
  OpportunityScoreBreakdown,
  getOpportunityRating,
  DIMENSION_LABELS,
  type OpportunityScoreDimension,
} from '@/lib/opportunity-scoring';

interface OpportunityScorePanelProps {
  rfpId: string;
  score: number | null;
  breakdown: OpportunityScoreBreakdown | null;
  source: 'AUTO' | 'MANUAL' | null;
  updatedAt: Date | null;
  overrideReason: string | null;
}

export default function OpportunityScorePanel({
  rfpId,
  score: initialScore,
  breakdown: initialBreakdown,
  source: initialSource,
  updatedAt: initialUpdatedAt,
  overrideReason: initialOverrideReason,
}: OpportunityScorePanelProps) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [source, setSource] = useState(initialSource);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [overrideReason, setOverrideReason] = useState(initialOverrideReason);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showRecalculateConfirm, setShowRecalculateConfirm] = useState(false);
  
  // Manual override form state
  const [manualScore, setManualScore] = useState('');
  const [manualReason, setManualReason] = useState('');

  // ================================
  // Handlers
  // ================================

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch(`/api/rfps/${rfpId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'auto' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate score');
      }

      // Update local state
      setScore(data.score);
      setBreakdown(data.breakdown);
      setSource(data.source);
      setUpdatedAt(new Date());
      setOverrideReason(null);

      // Refresh page to ensure all data is synced
      router.refresh();
    } catch (err) {
      console.error('Calculate score error:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate score');
    } finally {
      setIsCalculating(false);
      setShowRecalculateConfirm(false);
    }
  };

  const handleRecalculate = () => {
    // If manual override exists, show confirmation
    if (source === 'MANUAL') {
      setShowRecalculateConfirm(true);
    } else {
      handleCalculate();
    }
  };

  const handleManualOverride = () => {
    setManualScore(score?.toString() || '');
    setManualReason(overrideReason || '');
    setShowManualModal(true);
  };

  const handleManualSubmit = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const numericScore = parseInt(manualScore, 10);
      
      if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error('Score must be a number between 0 and 100');
      }

      if (!manualReason.trim()) {
        throw new Error('Please provide a reason for the override');
      }

      // Create a simple breakdown with the manual score for all dimensions
      const manualBreakdown: OpportunityScoreBreakdown = {
        strategicFit: { score: numericScore, rationale: 'Manual override' },
        solutionFit: { score: numericScore, rationale: 'Manual override' },
        competitiveAdvantage: { score: numericScore, rationale: 'Manual override' },
        budgetAlignment: { score: numericScore, rationale: 'Manual override' },
        timelineFeasibility: { score: numericScore, rationale: 'Manual override' },
        winProbability: { score: numericScore, rationale: 'Manual override' },
        internalReadiness: { score: numericScore, rationale: 'Manual override' },
        riskScore: { score: Math.max(0, 100 - numericScore), rationale: 'Manual override' },
        overallComment: manualReason,
      };

      const response = await fetch(`/api/rfps/${rfpId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          breakdown: manualBreakdown,
          overrideReason: manualReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save manual score');
      }

      // Update local state
      setScore(data.score);
      setBreakdown(data.breakdown);
      setSource(data.source);
      setUpdatedAt(new Date());
      setOverrideReason(manualReason);
      setShowManualModal(false);

      // Refresh page
      router.refresh();
    } catch (err) {
      console.error('Manual override error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save manual score');
    } finally {
      setIsCalculating(false);
    }
  };

  // ================================
  // Render Helpers
  // ================================

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  const ratingInfo = score !== null ? getOpportunityRating(score) : null;

  // ================================
  // No Score Yet State
  // ================================

  if (score === null) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Opportunity Score</h3>
          <TrendingUp className="h-6 w-6 text-gray-400" />
        </div>
        
        <p className="text-gray-600 mb-4">
          No opportunity score has been calculated yet.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-md hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Calculate Score with AI
            </>
          )}
        </button>
      </div>
    );
  }

  // ================================
  // Score Exists State
  // ================================

  const dimensions: OpportunityScoreDimension[] = [
    'strategicFit',
    'solutionFit',
    'competitiveAdvantage',
    'budgetAlignment',
    'timelineFeasibility',
    'winProbability',
    'internalReadiness',
    'riskScore',
  ];

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Opportunity Score</h3>
          <TrendingUp className="h-6 w-6 text-gray-400" />
        </div>

        {/* Score Badge */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-gray-900">{score}</span>
              <span className="text-2xl text-gray-400">/ 100</span>
            </div>
            {ratingInfo && (
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${ratingInfo.bgColor} ${ratingInfo.textColor}`}>
                {ratingInfo.label}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="text-sm text-gray-600 mb-4 space-y-1">
          <div>
            <span className="font-medium">Source:</span>{' '}
            {source === 'AUTO' ? 'AI-calculated' : 'Manual override'}
          </div>
          <div>
            <span className="font-medium">Last updated:</span>{' '}
            {formatDate(updatedAt)}
          </div>
          {overrideReason && (
            <div>
              <span className="font-medium">Override reason:</span>{' '}
              {overrideReason}
            </div>
          )}
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="mb-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
            <div className="space-y-2">
              {dimensions.map((dimension) => {
                const dimData = breakdown[dimension];
                return (
                  <div key={dimension} className="flex items-start gap-3 text-sm">
                    <div className="w-32 flex-shrink-0">
                      <span className="font-medium text-gray-700">
                        {DIMENSION_LABELS[dimension]}:
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{dimData.score}</span>
                      <span className="text-gray-500"> – {dimData.rationale}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {breakdown.overallComment && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                <span className="font-medium">Overall:</span> {breakdown.overallComment}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Recalculate with AI
              </>
            )}
          </button>
          
          <button
            onClick={handleManualOverride}
            disabled={isCalculating}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Manual Override
          </button>
        </div>
      </div>

      {/* Recalculate Confirmation Modal */}
      {showRecalculateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Recalculation</h3>
            <p className="text-gray-600 mb-6">
              This will replace your manual override with a fresh AI-calculated score. Continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRecalculateConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCalculate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Yes, Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Override Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Override</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={manualScore}
                  onChange={(e) => setManualScore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter score 0-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Override Reason
                </label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain why you're overriding the score..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setError(null);
                }}
                disabled={isCalculating}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isCalculating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Override'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
