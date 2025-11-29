'use client';

import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

// Define status order based on workflow
const STATUS_ORDER = [
  'draft',
  'published',
  'completed'
];

// Pretty print status labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  completed: 'Completed'
};

// Status column colors
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-50',
  published: 'bg-blue-50',
  completed: 'bg-green-50'
};

// Priority colors
const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700'
};

interface RFP {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  company: { name: string } | null;
}

interface KanbanBoardProps {
  initialRfps: RFP[];
}

export default function KanbanBoard({ initialRfps }: KanbanBoardProps) {
  const [rfps, setRfps] = useState(initialRfps);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique companies from RFPs
  const companies = useMemo(() => {
    const uniqueCompanies = new Set<string>();
    rfps.forEach(rfp => {
      if (rfp.company?.name) {
        uniqueCompanies.add(rfp.company.name);
      }
    });
    return Array.from(uniqueCompanies).sort();
  }, [rfps]);

  // Apply filters
  const filteredRfps = useMemo(() => {
    return rfps.filter(rfp => {
      // Priority filter
      if (priorityFilter !== 'all' && rfp.priority !== priorityFilter.toUpperCase()) {
        return false;
      }

      // Company filter
      if (companyFilter !== 'all' && rfp.company?.name !== companyFilter) {
        return false;
      }

      // Search filter (case-insensitive across title, company name, description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = rfp.title.toLowerCase().includes(query);
        const matchesCompany = rfp.company?.name.toLowerCase().includes(query) || false;
        const matchesDescription = rfp.description?.toLowerCase().includes(query) || false;
        
        if (!matchesTitle && !matchesCompany && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [rfps, priorityFilter, companyFilter, searchQuery]);

  // Group filtered RFPs by status
  const groupedRfps = useMemo(() => {
    return filteredRfps.reduce((acc, rfp) => {
      if (!acc[rfp.status]) {
        acc[rfp.status] = [];
      }
      acc[rfp.status].push(rfp);
      return acc;
    }, {} as Record<string, RFP[]>);
  }, [filteredRfps]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const rfpId = draggableId;

    // Find the RFP
    const rfp = rfps.find(r => r.id === rfpId);
    if (!rfp) return;

    const oldStatus = rfp.status;

    // Optimistic update
    setRfps(prev =>
      prev.map(r => (r.id === rfpId ? { ...r, status: newStatus } : r))
    );

    // Persist to backend
    try {
      const res = await fetch(`/api/rfps/${rfpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setError(null);
    } catch (err) {
      // Revert on error
      setRfps(prev =>
        prev.map(r => (r.id === rfpId ? { ...r, status: oldStatus } : r))
      );
      setError('Failed to update RFP status. Please try again.');
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div>
      {/* Error Toast */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* Priority Filter */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Company Filter */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm min-w-[200px]"
            >
              <option value="all">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search RFPs..."
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(priorityFilter !== 'all' || companyFilter !== 'all' || searchQuery) && (
            <div className="flex-shrink-0 self-end">
              <button
                onClick={() => {
                  setPriorityFilter('all');
                  setCompanyFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Filter Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredRfps.length} of {rfps.length} RFPs
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map(status => {
            const statusRfps = groupedRfps[status] || [];
            const label = STATUS_LABELS[status] || status;
            const bgColor = STATUS_COLORS[status] || 'bg-gray-50';

            return (
              <div
                key={status}
                className={`flex-shrink-0 w-80 ${bgColor} rounded-lg p-4`}
              >
                {/* Column Header */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {label} ({statusRfps.length})
                  </h3>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-50 rounded-lg p-2' : ''
                      }`}
                    >
                      {statusRfps.map((rfp, index) => (
                        <Draggable
                          key={rfp.id}
                          draggableId={rfp.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-move ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''
                              }`}
                            >
                              {/* RFP Card */}
                              <Link
                                href={`/dashboard/rfps/${rfp.id}`}
                                className="block"
                              >
                                <h4 className="font-semibold text-gray-900 hover:text-indigo-600 mb-2">
                                  {rfp.title}
                                </h4>
                              </Link>

                              {/* Company */}
                              {rfp.company && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {rfp.company.name}
                                </p>
                              )}

                              {/* Priority Badge */}
                              {rfp.priority && (
                                <span
                                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                    PRIORITY_COLORS[rfp.priority as keyof typeof PRIORITY_COLORS] ||
                                    'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {rfp.priority}
                                </span>
                              )}

                              {/* Due Date */}
                              {rfp.dueDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Due: {new Date(rfp.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
