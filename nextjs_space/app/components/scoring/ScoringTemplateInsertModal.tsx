/**
 * STEP 58: Scoring Matrix Template Library
 * Component: Scoring Template Insert Modal
 * Purpose: Modal for inserting scoring templates into RFPs or RFP Templates
 */

'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';

interface ScoringCategory {
  categoryName: string;
  weight: number;
  scoringType: string;
  notes?: string;
}

interface ScoringTemplate {
  id: string;
  title: string;
  description: string | null;
  categoriesJson: ScoringCategory[];
  requirementsJson: string[] | null;
  versionCount: number;
}

interface ScoringTemplateInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'rfp' | 'rfp_template';
  targetId: string;
  onInsert?: () => void;
}

export default function ScoringTemplateInsertModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  onInsert
}: ScoringTemplateInsertModalProps) {
  const [templates, setTemplates] = useState<ScoringTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const response = await fetch('/api/scoring-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleInsert() {
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    try {
      setInserting(true);
      setError(null);

      const endpoint = targetType === 'rfp' 
        ? `/api/scoring-templates/${selectedTemplateId}/insert-rfp`
        : `/api/scoring-templates/${selectedTemplateId}/insert-rfp-template`;

      const body = targetType === 'rfp'
        ? { rfpId: targetId }
        : { rfpTemplateId: targetId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to insert template');
      }

      setSuccess(true);
      
      // Call onInsert callback after a short delay
      setTimeout(() => {
        onInsert?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error inserting template:', err);
      setError(err.message || 'Failed to insert template');
    } finally {
      setInserting(false);
    }
  }

  function calculateTotalWeight(categories: ScoringCategory[]): number {
    return categories.reduce((sum, cat) => sum + cat.weight, 0);
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const totalWeight = selectedTemplate ? calculateTotalWeight(selectedTemplate.categoriesJson) : 0;
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-demo="scoring-template-insert-modal"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Insert Scoring Template
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a scoring template to {targetType === 'rfp' ? 'insert into this RFP' : 'link to this RFP template'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={inserting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Template inserted successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {targetType === 'rfp' 
                    ? 'The scoring matrix has been added to the RFP as a frozen copy.'
                    : 'The scoring template has been linked to the RFP template.'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Template *
            </label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-sm text-gray-500">No templates available</div>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={inserting || success}
              >
                <option value="">Choose a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title} ({template.categoriesJson.length} categories, v{template.versionCount})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview</h3>
              
              <div className="mb-3">
                <p className="text-xs text-gray-500">Title</p>
                <p className="text-sm font-medium text-gray-900">{selectedTemplate.title}</p>
              </div>

              {selectedTemplate.description && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-700">{selectedTemplate.description}</p>
                </div>
              )}

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Categories & Weights</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                      Total: {totalWeight.toFixed(1)}%
                    </span>
                    {!isWeightValid && (
                      <span className="text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Must equal 100%
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedTemplate.categoriesJson.map((category, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{category.categoryName}</p>
                        <p className="text-xs text-gray-500">{category.scoringType}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {category.weight}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTemplate.requirementsJson && selectedTemplate.requirementsJson.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Requirements</p>
                  <p className="text-sm text-gray-700">
                    {selectedTemplate.requirementsJson.length} requirement block(s) attached
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Information Box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900 font-medium mb-1">
              {targetType === 'rfp' ? '📋 Frozen Copy' : '🔗 Live Reference'}
            </p>
            <p className="text-xs text-blue-700">
              {targetType === 'rfp' 
                ? 'RFPs store a frozen copy of the scoring matrix. Changes to the template will not affect this RFP.'
                : 'RFP Templates store a reference to the scoring template. You can manually sync to get updates.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={inserting}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!selectedTemplateId || inserting || !isWeightValid || success}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              !selectedTemplateId || inserting || !isWeightValid || success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {inserting ? 'Inserting...' : success ? 'Inserted!' : 'Insert Scoring Matrix'}
          </button>
        </div>
      </div>
    </div>
  );
}
