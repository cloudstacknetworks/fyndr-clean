// STEP 56: Company-Level RFP Master Template Library - Create New Template Page
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NewTemplatePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'company' | 'private'>('company');
  const [category, setCategory] = useState('');
  const [contentJson, setContentJson] = useState(
    JSON.stringify(
      {
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            questions: [
              {
                id: 'q1',
                text: 'Question 1',
                type: 'text',
              },
            ],
          },
        ],
      },
      null,
      2
    )
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(contentJson);
    } catch (e) {
      setError('Invalid JSON in content field');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/dashboard/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          visibility,
          category: category || undefined,
          initialContentJson: parsedContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create template');
      }

      const data = await response.json();
      alert('Template created successfully!');
      router.push(`/dashboard/templates/${data.template.id}`);
    } catch (error: any) {
      console.error('Error creating template:', error);
      setError(error.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Create New Template</h1>
                <p className="text-sm text-gray-600">
                  Define a reusable RFP template for your organization
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
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
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Standard IT Services RFP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this template is for..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility *
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'company' | 'private')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="company">Company (Visible to all)</option>
                    <option value="private">Private (Only me)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Company templates are accessible by all team members
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., IT Services"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: helps organize templates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Content</h2>
            <p className="text-sm text-gray-600 mb-4">
              Define the template structure in JSON format. This includes sections, questions, and
              default values.
            </p>
            <textarea
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='{"sections": [], "questions": []}'
            />
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Template Structure Guide</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Define sections with id, title, and questions</li>
                <li>• Each question should have id, text, and type</li>
                <li>• Supported types: text, textarea, select, radio, checkbox</li>
                <li>• Add default values, validation rules, and help text as needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
