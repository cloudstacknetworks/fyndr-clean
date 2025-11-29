'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Eye, Loader2, AlertCircle, CheckCircle, FileCheck } from 'lucide-react';

interface SupplierResponsesPanelProps {
  rfpId: string;
}

interface SupplierResponseData {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  responseStatus: 'Not Started' | 'Draft' | 'Submitted';
  submittedAt: string | null;
  attachmentsCount: number;
}

export default function SupplierResponsesPanel({ rfpId }: SupplierResponsesPanelProps) {
  const [responses, setResponses] = useState<SupplierResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, [rfpId]);

  const fetchResponses = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/responses`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch responses');
      }

      setResponses(data.responses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Submitted
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case 'Not Started':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            Not Started
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Supplier Responses</h2>
        </div>
        <span className="text-sm text-gray-500">
          {responses.length} {responses.length === 1 ? 'supplier' : 'suppliers'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && responses.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No supplier contacts have been invited yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Invite suppliers using the section above to start receiving responses
          </p>
        </div>
      )}

      {!loading && !error && responses.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map((response) => (
                <tr key={response.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {response.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{response.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {response.organization || '–'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(response.responseStatus)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {response.submittedAt
                        ? new Date(response.submittedAt).toLocaleDateString()
                        : '–'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {response.attachmentsCount > 0 ? (
                        <span className="font-medium text-indigo-600">
                          {response.attachmentsCount} {response.attachmentsCount === 1 ? 'file' : 'files'}
                        </span>
                      ) : (
                        '–'
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/rfps/${rfpId}/responses/${response.id}`}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
