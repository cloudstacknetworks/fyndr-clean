/**
 * Evaluation Matrix Management Page
 * 
 * Create and manage custom evaluation criteria and weights for supplier comparison
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_WEIGHTS } from '@/lib/supplier-comparison';

interface Criterion {
  id: string;
  label: string;
  weight: number;
}

interface Matrix {
  id: string;
  name: string;
  criteria: Criterion[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CRITERIA_OPTIONS = [
  { id: 'requirementsCoverage', label: 'Requirements Coverage' },
  { id: 'pricingCompetitiveness', label: 'Pricing Competitiveness' },
  { id: 'technicalStrength', label: 'Technical Strength' },
  { id: 'differentiators', label: 'Differentiators' },
  { id: 'riskProfile', label: 'Risk Profile (Inverse)' },
  { id: 'assumptionsQuality', label: 'Assumptions Quality (Inverse)' },
  { id: 'demoQuality', label: 'Demo Quality' },
];

export default function MatrixPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [matrixName, setMatrixName] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const rfpId = params.id;

  // Load matrix on mount
  useEffect(() => {
    loadMatrix();
  }, [rfpId]);

  const loadMatrix = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/matrix`);

      if (!response.ok) {
        throw new Error('Failed to load matrix');
      }

      const data = await response.json();

      if (data.matrix) {
        setMatrix(data.matrix);
        setMatrixName(data.matrix.name);
        setCriteria(data.matrix.criteria);
      } else {
        // No matrix exists, initialize with default weights
        setMatrixName('Custom Evaluation Matrix');
        setCriteria(
          DEFAULT_CRITERIA_OPTIONS.map((opt) => ({
            id: opt.id,
            label: opt.label,
            weight: DEFAULT_WEIGHTS[opt.id as keyof typeof DEFAULT_WEIGHTS],
          }))
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total weight
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValidWeight = Math.abs(totalWeight - 100) < 0.01;

  // Update criterion weight
  const updateCriterionWeight = (index: number, weight: number) => {
    const newCriteria = [...criteria];
    newCriteria[index].weight = weight;
    setCriteria(newCriteria);
  };

  // Add criterion
  const addCriterion = () => {
    const usedIds = new Set(criteria.map((c) => c.id));
    const availableOptions = DEFAULT_CRITERIA_OPTIONS.filter(
      (opt) => !usedIds.has(opt.id)
    );

    if (availableOptions.length === 0) {
      setError('All criteria have been added');
      return;
    }

    const newOption = availableOptions[0];
    setCriteria([
      ...criteria,
      {
        id: newOption.id,
        label: newOption.label,
        weight: 0,
      },
    ]);
  };

  // Remove criterion
  const removeCriterion = (index: number) => {
    const newCriteria = criteria.filter((_, idx) => idx !== index);
    setCriteria(newCriteria);
  };

  // Save matrix
  const handleSave = async () => {
    if (!matrixName.trim()) {
      setError('Matrix name is required');
      return;
    }

    if (!isValidWeight) {
      setError(`Total weight must equal 100. Current total: ${totalWeight.toFixed(1)}`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: matrixName.trim(),
          criteria,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save matrix');
      }

      const data = await response.json();
      setMatrix(data.matrix);
      setSuccess('Evaluation matrix saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete matrix
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this evaluation matrix?')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/matrix`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete matrix');
      }

      setSuccess('Matrix deleted successfully. Comparisons will use default weights.');
      setMatrix(null);

      // Reset to default
      setMatrixName('Custom Evaluation Matrix');
      setCriteria(
        DEFAULT_CRITERIA_OPTIONS.map((opt) => ({
          id: opt.id,
          label: opt.label,
          weight: DEFAULT_WEIGHTS[opt.id as keyof typeof DEFAULT_WEIGHTS],
        }))
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Reset to default weights
  const handleResetToDefaults = () => {
    if (
      !confirm(
        'Are you sure you want to reset all weights to default values? This will discard your current changes.'
      )
    ) {
      return;
    }

    setCriteria(
      DEFAULT_CRITERIA_OPTIONS.map((opt) => ({
        id: opt.id,
        label: opt.label,
        weight: DEFAULT_WEIGHTS[opt.id as keyof typeof DEFAULT_WEIGHTS],
      }))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/dashboard/rfps/${rfpId}/compare`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Comparison
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Evaluation Matrix
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Customize criteria and weights for supplier comparison scoring
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
              <div className="text-sm text-green-700">{success}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Matrix Name */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrix Name
              </label>
              <input
                type="text"
                value={matrixName}
                onChange={(e) => setMatrixName(e.target.value)}
                placeholder="e.g., Q1 2025 Evaluation Matrix"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Criteria List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Evaluation Criteria
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Total weight must equal 100%
                  </p>
                </div>
                <button
                  onClick={addCriterion}
                  disabled={criteria.length >= DEFAULT_CRITERIA_OPTIONS.length}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Criterion
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {criteria.map((criterion, index) => (
                    <div
                      key={criterion.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          {criterion.label}
                        </label>
                        <p className="text-xs text-gray-500">ID: {criterion.id}</p>
                      </div>

                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Weight (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={criterion.weight}
                          onChange={(e) =>
                            updateCriterionWeight(index, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <button
                        onClick={() => removeCriterion(index)}
                        disabled={criteria.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove criterion"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Weight Display */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Weight:</span>
                    <span
                      className={`text-lg font-bold ${
                        isValidWeight ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {totalWeight.toFixed(1)}%
                    </span>
                  </div>
                  {!isValidWeight && (
                    <div className="mt-2 text-xs text-red-600">
                      ⚠️ Adjust weights to equal 100% before saving
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <button
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </button>

                {matrix && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Matrix
                  </button>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !isValidWeight || !matrixName.trim()}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Matrix
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 How Evaluation Matrices Work
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Custom matrices allow you to prioritize specific criteria based on your
                  organization's needs.
                </li>
                <li>
                  • Each criterion is scored 0-100, then multiplied by its weight to calculate the
                  final score.
                </li>
                <li>
                  • If no matrix is set, the system uses default weights (Requirements Coverage: 30%,
                  Pricing: 25%, etc.).
                </li>
                <li>
                  • Save your matrix, then run the comparison to apply the new weights to all
                  supplier responses.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
