/**
 * STEP 57: Company-Level Master Requirements Library
 * UI Component: Requirements Library List View
 * Path: /dashboard/requirements
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Copy, Archive, Edit, Eye } from 'lucide-react';

interface RequirementBlock {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  currentVersion: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export default function RequirementsLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [requirements, setRequirements] = useState<RequirementBlock[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<RequirementBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchRequirements();
    }
  }, [session]);

  useEffect(() => {
    filterRequirements();
  }, [requirements, searchTerm, categoryFilter]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requirements');
      if (!res.ok) throw new Error('Failed to fetch requirements');
      const data = await res.json();
      setRequirements(data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequirements = () => {
    let filtered = requirements;

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      filtered = filtered.filter((req) => req.category === categoryFilter);
    }

    setFilteredRequirements(filtered);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/requirements/${id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to duplicate requirement');
      alert('Requirement duplicated successfully!');
      fetchRequirements();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return;

    try {
      const res = await fetch(`/api/requirements/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete requirement');
      alert('Requirement deleted successfully!');
      fetchRequirements();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Requirements Library</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage reusable requirement blocks for your RFPs
              </p>
            </div>
            <Link
              href="/dashboard/requirements/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Requirement
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="ALL">All Categories</option>
                <option value="FUNCTIONAL">Functional</option>
                <option value="TECHNICAL">Technical</option>
                <option value="LEGAL">Legal</option>
                <option value="SECURITY">Security</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Requirements</p>
            <p className="text-2xl font-bold text-gray-900">{requirements.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Filtered Results</p>
            <p className="text-2xl font-bold text-indigo-600">{filteredRequirements.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(requirements.map((r) => r.category)).size}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No requirements found. Try adjusting your filters or create a new requirement.
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{req.title}</div>
                        {req.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {req.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          req.visibility === 'COMPANY'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {req.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{req.currentVersion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/requirements/${req.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit className="inline w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(req.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Copy className="inline w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Archive className="inline w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
