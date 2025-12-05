/**
 * STEP 61: Buyer Evaluation Workspace - Override Modal Component
 * 
 * Modal for applying or clearing score overrides
 */

'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ScoringItem } from '@/lib/evaluation/evaluation-engine';

interface OverrideModalProps {
  isOpen: boolean;
  scoringItem: ScoringItem | null;
  onClose: () => void;
  onSaveOverride: (requirementId: string, score: number, justification: string) => Promise<void>;
  onClearOverride: (requirementId: string) => Promise<void>;
}

export default function OverrideModal({
  isOpen,
  scoringItem,
  onClose,
  onSaveOverride,
  onClearOverride,
}: OverrideModalProps) {
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [justification, setJustification] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (scoringItem) {
      setOverrideScore(scoringItem.overrideScore ?? scoringItem.autoScore);
      setJustification(scoringItem.overrideJustification ?? '');
      setError('');
    }
  }, [scoringItem]);

  const handleSave = async () => {
    if (!scoringItem) return;

    if (!justification.trim()) {
      setError('Justification is required');
      return;
    }

    if (overrideScore < 0 || overrideScore > 100) {
      setError('Score must be between 0 and 100');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSaveOverride(scoringItem.requirementId, overrideScore, justification.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save override');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!scoringItem) return;

    setLoading(true);
    setError('');

    try {
      await onClearOverride(scoringItem.requirementId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to clear override');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !scoringItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl z-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Override Score</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Requirement:</strong> {scoringItem.requirementTitle}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Auto Score:</strong> {scoringItem.autoScore.toFixed(0)}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Override Score (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={overrideScore}
            onChange={(e) => setOverrideScore(Number(e.target.value))}
            className="w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
            className="w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            placeholder="Explain why you are overriding the auto-score..."
          />
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <div>
            {scoringItem.overrideScore !== null && (
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-600 hover:border-red-800 rounded transition disabled:opacity-50"
              >
                Clear Override
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!justification.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
