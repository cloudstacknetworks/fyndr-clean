/**
 * STEP 58: Scoring Matrix Template Library
 * UI Component: Scoring Templates Library List View
 * Path: /dashboard/scoring-templates
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Copy, Archive, Eye, MoreVertical } from 'lucide-react';

interface ScoringTemplate {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  categoryCount: number;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string | null;
    email: string;
  };
}

export default function ScoringTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ScoringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<'company' | 'private' | undefined>();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [search, visibility]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (visibility) params.append('visibility', visibility);

      const response = await fetch(`/api/scoring-templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClone(id: string) {
    try {
      const response = await fetch(`/api/scoring-templates/${id}/clone`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to clone template');

      const data = await response.json();
      router.push(`/dashboard/scoring-templates/${data.template.id}`);
    } catch (error) {
      console.error('Error cloning template:', error);
      alert('Failed to clone template');
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('Are you sure you want to archive this template?')) return;

    try {
      const response = await fetch(`/api/scoring-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to archive template');

      fetchTemplates();
    } catch (error) {
      console.error('Error archiving template:', error);
      alert('Failed to archive template');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-demo="scoring-template-library">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scoring Matrix Templates</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create reusable scoring matrices for consistent RFP evaluation
              </p>
            </div>
            <Link
              href="/dashboard/scoring-templates/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Template
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4" data-demo="scoring-templates-filters">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={visibility || ''}
              onChange={(e) => setVisibility(e.target.value ? e.target.value as 'company' | 'private' : undefined)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Visibility</option>
              <option value="company">Company</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Templates Table */}
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              Create your first scoring matrix template to get started
            </p>
            <Link
              href="/dashboard/scoring-templates/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Template
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg" data-demo="scoring-templates-table">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Versions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="cursor-pointer" onClick={() => router.push(`/dashboard/scoring-templates/${template.id}`)}>
                        <div className="text-sm font-medium text-gray-900">{template.title}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.visibility === 'company' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.categoryCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.versionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{template.createdBy.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{template.createdBy.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setMenuOpen(menuOpen === template.id ? null : template.id)}
                          className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {menuOpen === template.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  router.push(`/dashboard/scoring-templates/${template.id}`);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  handleClone(template.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Clone
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  handleArchive(template.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
