/**
 * STEP 57: Company-Level Master Requirements Library
 * UI Component: Requirement Editor / Detail View
 * Path: /dashboard/requirements/[id]
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, Clock, Save, History } from 'lucide-react';

interface RequirementVersion {
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

interface RequirementBlock {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  contentJson: any;
  currentVersion: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  versions: RequirementVersion[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export default function RequirementEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const requirementId = params?.id as string;

  const [requirement, setRequirement] = useState<RequirementBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FUNCTIONAL');
  const [visibility, setVisibility] = useState('COMPANY');
  const [contentJson, setContentJson] = useState<any>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (requirementId && session) {
      fetchRequirement();
    }
  }, [requirementId, session]);

  const fetchRequirement = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requirements/${requirementId}`);
      if (!res.ok) throw new Error('Failed to fetch requirement');
      const data = await res.json();
      setRequirement(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category);
      setVisibility(data.visibility);
      setContentJson(data.contentJson || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/requirements/${requirementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          visibility,
          contentJson,
        }),
      });

      if (!res.ok) throw new Error('Failed to save requirement');
      const data = await res.json();
      setRequirement(data.requirement);
      alert('Requirement saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requirement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <Link
            href="/dashboard/requirements"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Requirements
          </Link>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Requirement not found</p>
          <Link
            href="/dashboard/requirements"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Requirements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/requirements"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Requirements
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Version {requirement.currentVersion} • Last updated{' '}
                {new Date(requirement.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('edit')}
                className={`${
                  activeTab === 'edit'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
              >
                <History className="w-4 h-4 mr-2" />
                Version History ({requirement.versions?.length || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'edit' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="FUNCTIONAL">Functional</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="LEGAL">Legal</option>
                      <option value="SECURITY">Security</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="COMPANY">Company-Wide</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(contentJson, null, 2)}
                    onChange={(e) => {
                      try {
                        setContentJson(JSON.parse(e.target.value));
                      } catch (err) {
                        // Invalid JSON, keep as string
                      }
                    }}
                    rows={10}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {requirement.versions && requirement.versions.length > 0 ? (
                  requirement.versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          Version {version.versionNumber}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        By {version.createdBy.name} ({version.createdBy.email})
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No version history available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
