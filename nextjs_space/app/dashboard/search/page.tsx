/**
 * STEP 48: Global Search Results Page
 * PHASE 5: Search Results Page
 * 
 * Full results page at /dashboard/search?q={query}
 * - Displays all search results grouped by category
 * - Shows all results (not limited to 5 like the dropdown)
 * - Logs activity when page loads
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, Users, MessageSquare, Archive, BookOpen, Activity, AlertCircle, Loader2 } from 'lucide-react';

interface SearchResults {
  rfpResults: any[];
  supplierResults: any[];
  summaryResults: any[];
  activityResults: any[];
  clauseResults: any[];
  archivedRfpResults: any[];
}

interface ApiResponse {
  success: boolean;
  query: string;
  results: SearchResults;
  resultCounts: {
    rfps: number;
    suppliers: number;
    summaries: number;
    activities: number;
    clauses: number;
    archivedRfps: number;
    total: number;
  };
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResults | null>(null);
  const [resultCounts, setResultCounts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setError('Please enter at least 2 characters to search');
      setIsLoading(false);
      return;
    }

    performSearch(query);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: ApiResponse = await response.json();
      setResults(data.results);
      setResultCounts(data.resultCounts);

      // Log activity: GLOBAL_SEARCH_VIEWED_RESULTS (done by the activity log on page load)
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Searching...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Search Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results || !resultCounts) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No results to display</p>
        </div>
      </div>
    );
  }

  const getTotalResults = () => resultCounts.total || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto" data-demo="search-results-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
        <p className="text-gray-600">
          Found {getTotalResults()} result{getTotalResults() !== 1 ? 's' : ''} for "{query}"
        </p>
      </div>

      {/* Results Sections */}
      <div className="space-y-8">
        {/* RFPs Section */}
        {results.rfpResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                RFPs ({results.rfpResults.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {results.rfpResults.map((rfp) => (
                <Link
                  key={rfp.id}
                  href={`/dashboard/rfps/${rfp.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{rfp.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rfp.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                      {rfp.stage}
                    </span>
                    {rfp.companyName && <span>Company: {rfp.companyName}</span>}
                    {rfp.supplierName && <span>Supplier: {rfp.supplierName}</span>}
                    {rfp.budget && <span>Budget: ${rfp.budget.toLocaleString()}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Suppliers Section */}
        {results.supplierResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Suppliers ({results.supplierResults.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {results.supplierResults.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/dashboard/suppliers/${supplier.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{supplier.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {supplier.contactName && <p>Contact: {supplier.contactName}</p>}
                    {supplier.contactEmail && <p>Email: {supplier.contactEmail}</p>}
                    <p className="text-indigo-600 font-medium">{supplier.rfpCount} RFPs</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Executive Summaries Section */}
        {results.summaryResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Executive Summaries ({results.summaryResults.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {results.summaryResults.map((summary) => (
                <Link
                  key={summary.id}
                  href={`/dashboard/rfps/${summary.rfpId}`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {summary.title || 'Executive Summary'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {summary.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {summary.rfpTitle && <span>RFP: {summary.rfpTitle}</span>}
                    {summary.tone && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {summary.tone}
                    </span>}
                    {summary.audience && <span>Audience: {summary.audience}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Activities Section */}
        {results.activityResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Activities ({results.activityResults.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {results.activityResults.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.rfpId ? `/dashboard/rfps/${activity.rfpId}/activity` : '/dashboard/activity'}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.type}</h3>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {activity.rfpTitle && <span>RFP: {activity.rfpTitle}</span>}
                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Clause Library Section */}
        {results.clauseResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Clause Library ({results.clauseResults.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {results.clauseResults.map((clause) => (
                <Link
                  key={clause.id}
                  href="/dashboard/rfp-templates/clauses"
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{clause.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{clause.body}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {clause.category && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {clause.category}
                    </span>}
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {clause.clauseType}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Archived RFPs Section */}
        {results.archivedRfpResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Archive className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Archived RFPs ({results.archivedRfpResults.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {results.archivedRfpResults.map((rfp) => (
                <Link
                  key={rfp.id}
                  href={`/dashboard/rfps/${rfp.id}/archive`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{rfp.title}</h3>
                  {rfp.snapshotSummary && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rfp.snapshotSummary}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Archived</span>
                    {rfp.companyName && <span>Company: {rfp.companyName}</span>}
                    {rfp.supplierName && <span>Supplier: {rfp.supplierName}</span>}
                    <span>Archived: {new Date(rfp.archivedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {getTotalResults() === 0 && (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search query or search for something else.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
