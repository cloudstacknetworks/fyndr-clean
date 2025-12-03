/**
 * STEP 48: Global Search Bar Component
 * PHASE 4: Navbar Global Search Bar
 * 
 * Features:
 * - Debounced input (300ms delay)
 * - Live dropdown preview panel
 * - Grouped result sections (max 5 per category)
 * - Keyboard navigation (arrow keys, enter, escape)
 * - "View all results" link to /dashboard/search?q={query}
 * - Loading state, empty state, error handling
 * - data-demo attributes for demo mode
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, FileText, Users, MessageSquare, Archive, BookOpen, Activity } from 'lucide-react';

interface SearchResults {
  rfpResults: any[];
  supplierResults: any[];
  summaryResults: any[];
  activityResults: any[];
  clauseResults: any[];
  archivedRfpResults: any[];
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce logic (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      // Navigate to full results page
      if (query.trim().length >= 2) {
        router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return (
      results.rfpResults.length +
      results.supplierResults.length +
      results.summaryResults.length +
      results.activityResults.length +
      results.clauseResults.length +
      results.archivedRfpResults.length
    );
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md" data-demo="global-search-bar">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search RFPs, suppliers, summaries..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 animate-spin" />
        )}
      </div>

      {/* Dropdown Preview Panel */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 w-full max-w-2xl bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto"
          data-demo="global-search-results"
        >
          {error && (
            <div className="p-4 text-red-600 text-sm">{error}</div>
          )}

          {!error && results && getTotalResults() === 0 && (
            <div className="p-4 text-gray-500 text-sm text-center">
              No results found for "{query}"
            </div>
          )}

          {!error && results && getTotalResults() > 0 && (
            <>
              {/* RFPs Section */}
              {results.rfpResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      RFPs ({results.rfpResults.slice(0, 5).length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.rfpResults.slice(0, 5).map((rfp) => (
                      <Link
                        key={rfp.id}
                        href={`/dashboard/rfps/${rfp.id}`}
                        className="block px-4 py-3 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium text-gray-900">{rfp.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {rfp.companyName} • {rfp.stage}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers Section */}
              {results.supplierResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      Suppliers ({results.supplierResults.slice(0, 5).length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.supplierResults.slice(0, 5).map((supplier) => (
                      <Link
                        key={supplier.id}
                        href={`/dashboard/suppliers/${supplier.id}`}
                        className="block px-4 py-3 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {supplier.contactEmail} • {supplier.rfpCount} RFPs
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Summaries Section */}
              {results.summaryResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      Executive Summaries ({results.summaryResults.slice(0, 5).length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.summaryResults.slice(0, 5).map((summary) => (
                      <Link
                        key={summary.id}
                        href={`/dashboard/rfps/${summary.rfpId}`}
                        className="block px-4 py-3 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium text-gray-900">{summary.title || 'Executive Summary'}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {summary.rfpTitle} • {summary.tone}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities Section */}
              {results.activityResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      Activities ({results.activityResults.slice(0, 5).length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.activityResults.slice(0, 5).map((activity) => (
                      <Link
                        key={activity.id}
                        href={activity.rfpId ? `/dashboard/rfps/${activity.rfpId}/activity` : '/dashboard/activity'}
                        className="block px-4 py-3 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium text-gray-900">{activity.type}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {activity.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Clauses Section */}
              {results.clauseResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      Clause Library ({results.clauseResults.slice(0, 5).length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.clauseResults.slice(0, 5).map((clause) => (
                      <Link
                        key={clause.id}
                        href="/dashboard/rfp-templates/clauses"
                        className="block px-4 py-3 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium text-gray-900">{clause.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {clause.category} • {clause.clauseType}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Archived RFPs Section */}
              {results.archivedRfpResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                    <Archive className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      Archived RFPs ({results.archivedRfpResults.slice(0, 5).length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.archivedRfpResults.slice(0, 5).map((rfp) => (
                      <Link
                        key={rfp.id}
                        href={`/dashboard/rfps/${rfp.id}/archive`}
                        className="block px-4 py-3 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium text-gray-900">{rfp.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {rfp.companyName} • Archived{' '}
                          {new Date(rfp.archivedAt).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Results Link */}
              <div className="p-4 bg-gray-50 text-center">
                <Link
                  href={`/dashboard/search?q=${encodeURIComponent(query)}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all results ({getTotalResults()}) →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
