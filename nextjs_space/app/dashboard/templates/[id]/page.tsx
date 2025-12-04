// STEP 56: Company-Level RFP Master Template Library - Template Editor Page
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  History,
  Copy,
  Trash2,
  Lock,
  Users,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  visibility: 'company' | 'private';
  category?: string;
  defaultTimeline?: any;
  defaultSections?: any;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  versions: TemplateVersion[];
}

interface TemplateVersion {
  id: string;
  versionNumber: number;
  contentJson: any;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TemplateEditorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Edit state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'company' | 'private'>('company');
  const [category, setCategory] = useState('');
  const [contentJson, setContentJson] = useState('{}');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (templateId && session?.user?.id) {
      fetchTemplate();
    }
  }, [templateId, session]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to fetch template');

      const data = await response.json();
      const temp = data.template;
      setTemplate(temp);

      // Initialize edit state
      setName(temp.name);
      setDescription(temp.description || '');
      setVisibility(temp.visibility);
      setCategory(temp.category || '');

      // Get latest version content
      if (temp.versions && temp.versions.length > 0) {
        setContentJson(JSON.stringify(temp.versions[0].contentJson, null, 2));
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let parsedContent;
      try {
        parsedContent = JSON.parse(contentJson);
      } catch (e) {
        alert('Invalid JSON in content field');
        return;
      }

      const response = await fetch(`/api/dashboard/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          visibility,
          category: category || undefined,
          contentJson: parsedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save template');

      alert('Template saved successfully!');
      setHasUnsavedChanges(false);
      fetchTemplate(); // Refresh to get new version
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/dashboard/templates/${templateId}/clone`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to duplicate template');

      const data = await response.json();
      alert('Template duplicated successfully!');
      router.push(`/dashboard/templates/${data.template.id}`);
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/dashboard/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      alert('Template deleted successfully!');
      router.push('/dashboard/templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setHasUnsavedChanges(true);
    if (field === 'name') setName(value);
    if (field === 'description') setDescription(value);
    if (field === 'visibility') setVisibility(value);
    if (field === 'category') setCategory(value);
    if (field === 'content') setContentJson(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-6">
            The template you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/dashboard/templates')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/templates')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
                <div className="flex items-center gap-2 mt-1">
                  {visibility === 'company' ? (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <Users className="w-3 h-3" />
                      Company Template
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Lock className="w-3 h-3" />
                      Private Template
                    </span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="text-xs text-orange-600 font-medium">• Unsaved changes</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <History className="w-4 h-4" />
                Version History ({template.versions.length})
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Standard IT Services RFP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this template is for..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) =>
                        handleFieldChange('visibility', e.target.value as 'company' | 'private')
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="company">Company (Visible to all)</option>
                      <option value="private">Private (Only me)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., IT Services"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Content</h2>
              <p className="text-sm text-gray-600 mb-4">
                Edit the template structure in JSON format. This includes sections, questions, and
                default values.
              </p>
              <textarea
                value={contentJson}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder='{"sections": [], "questions": []}'
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Created by {template.createdBy.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Version History */}
            {showVersionHistory && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Version History</h2>
                <div className="space-y-3">
                  {template.versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          Version {version.versionNumber}
                        </span>
                        {version.versionNumber === template.versions[0].versionNumber && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>{version.createdBy.name}</div>
                        <div>{new Date(version.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
