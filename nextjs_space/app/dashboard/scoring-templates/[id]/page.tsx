/**
 * STEP 58: Scoring Matrix Template Library
 * UI Component: Scoring Template Editor
 * Path: /dashboard/scoring-templates/[id]
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react';

interface ScoringCategory {
  categoryName: string;
  weight: number;
  scoringType: 'numeric' | 'weighted' | 'qualitative' | 'pass/fail';
  notes?: string;
}

interface TemplateVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: {
    name: string | null;
    email: string;
  };
}

export default function ScoringTemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'company' | 'private'>('company');
  const [categories, setCategories] = useState<ScoringCategory[]>([
    { categoryName: '', weight: 100, scoringType: 'numeric', notes: '' },
  ]);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) {
      fetchTemplate();
    }
  }, [params.id]);

  async function fetchTemplate() {
    try {
      setLoading(true);
      const response = await fetch(`/api/scoring-templates/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch template');

      const data = await response.json();
      const template = data.template;

      setTitle(template.title);
      setDescription(template.description || '');
      setVisibility(template.visibility);
      setCategories(template.categoriesJson as ScoringCategory[]);
      setVersions(template.versions || []);
    } catch (error) {
      console.error('Error fetching template:', error);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  }

  function addCategory() {
    setCategories([
      ...categories,
      { categoryName: '', weight: 0, scoringType: 'numeric', notes: '' },
    ]);
  }

  function removeCategory(index: number) {
    if (categories.length === 1) {
      alert('At least one category is required');
      return;
    }
    setCategories(categories.filter((_, i) => i !== index));
  }

  function updateCategory(index: number, field: keyof ScoringCategory, value: any) {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  }

  function getTotalWeight() {
    return categories.reduce((sum, cat) => sum + (cat.weight || 0), 0);
  }

  function normalizeWeights() {
    const total = getTotalWeight();
    if (total === 0) {
      const equalWeight = 100 / categories.length;
      setCategories(categories.map((cat) => ({ ...cat, weight: equalWeight })));
    } else {
      setCategories(
        categories.map((cat) => ({
          ...cat,
          weight: (cat.weight / total) * 100,
        }))
      );
    }
  }

  async function handleSave() {
    try {
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (categories.some((cat) => !cat.categoryName.trim())) {
        setError('All categories must have a name');
        return;
      }

      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoriesJson: categories,
        visibility,
      };

      const url = isNew
        ? '/api/scoring-templates'
        : `/api/scoring-templates/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      const data = await response.json();
      router.push(`/dashboard/scoring-templates/${data.template.id}`);
    } catch (error: any) {
      console.error('Error saving template:', error);
      setError(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-demo="scoring-template-editor">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Create Scoring Template' : 'Edit Scoring Template'}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white shadow rounded-lg" data-demo="template-basic-info">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                General details about the scoring template
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Technical Evaluation Matrix"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose and use case of this template"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'company' | 'private')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="company">Company (visible to all)</option>
                    <option value="private">Private (only you)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white shadow rounded-lg" data-demo="scoring-categories">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Scoring Categories
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Define categories and their weights (must sum to 100%)
                  </p>
                </div>
                <div className="text-right" data-demo="category-weights">
                  <div className="text-sm text-gray-600">Total Weight:</div>
                  <div
                    className={`text-2xl font-bold ${
                      Math.abs(getTotalWeight() - 100) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {getTotalWeight().toFixed(1)}%
                  </div>
                  <button
                    onClick={normalizeWeights}
                    className="mt-1 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Normalize
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Category Name *
                            </label>
                            <input
                              type="text"
                              value={category.categoryName}
                              onChange={(e) =>
                                updateCategory(index, 'categoryName', e.target.value)
                              }
                              placeholder="e.g., Technical Capability"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Weight (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={category.weight}
                              onChange={(e) =>
                                updateCategory(index, 'weight', parseFloat(e.target.value) || 0)
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Scoring Type
                            </label>
                            <select
                              value={category.scoringType}
                              onChange={(e) =>
                                updateCategory(index, 'scoringType', e.target.value)
                              }
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                              <option value="numeric">Numeric (0-10)</option>
                              <option value="weighted">Weighted</option>
                              <option value="qualitative">Qualitative</option>
                              <option value="pass/fail">Pass/Fail</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={category.notes || ''}
                              onChange={(e) =>
                                updateCategory(index, 'notes', e.target.value)
                              }
                              placeholder="Optional notes"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {categories.length > 1 && (
                        <button
                          onClick={() => removeCategory(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={addCategory}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </button>
              </div>
            </div>
          </div>

          {/* Version History */}
          {!isNew && versions.length > 0 && (
            <div className="bg-white shadow rounded-lg" data-demo="template-versions">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Version History
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {versions.length} version{versions.length !== 1 ? 's' : ''}
                </p>

                <div className="space-y-2">
                  {versions.slice(0, 5).map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          v{version.versionNumber}
                        </span>
                        <div className="text-sm">
                          <div className="text-gray-900">{version.createdBy.name || 'Unknown'}</div>
                          <div className="text-gray-500">
                            {new Date(version.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
