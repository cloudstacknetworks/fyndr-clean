"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";

interface RFPFiltersPanelProps {
  onFiltersChange: (filters: any) => void;
}

export function RFPFiltersPanel({ onFiltersChange }: RFPFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<any>({
    stage: null,
    status: null,
    slaRisk: null,
    readiness: null,
    scoreMin: null,
    scoreMax: null,
    timelineWindow: null,
    hasUnansweredQuestions: false,
    hasOverdueTasks: false
  });

  const applyFilters = () => {
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      stage: null,
      status: null,
      slaRisk: null,
      readiness: null,
      scoreMin: null,
      scoreMax: null,
      timelineWindow: null,
      hasUnansweredQuestions: false,
      hasOverdueTasks: false
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.stage) count++;
    if (filters.status) count++;
    if (filters.slaRisk) count++;
    if (filters.readiness) count++;
    if (filters.scoreMin !== null) count++;
    if (filters.scoreMax !== null) count++;
    if (filters.timelineWindow) count++;
    if (filters.hasUnansweredQuestions) count++;
    if (filters.hasOverdueTasks) count++;
    return count;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount() > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
            {activeFilterCount()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white border rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filter RFPs</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stage filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Stage</label>
            <select
              value={filters.stage || ""}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Stages</option>
              <option value="INTAKE">Intake</option>
              <option value="QUALIFICATION">Qualification</option>
              <option value="DISCOVERY">Discovery</option>
              <option value="DRAFTING">Drafting</option>
              <option value="PRICING_LEGAL_REVIEW">Pricing/Legal Review</option>
              <option value="EXEC_REVIEW">Executive Review</option>
              <option value="SUBMISSION">Submission</option>
              <option value="DEBRIEF">Debrief</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* SLA Risk filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">SLA Risk</label>
            <select
              value={filters.slaRisk || ""}
              onChange={(e) => setFilters({ ...filters, slaRisk: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="red">🔴 Red (Overdue)</option>
              <option value="yellow">🟡 Yellow (At Risk)</option>
              <option value="green">🟢 Green (On Track)</option>
            </select>
          </div>

          {/* Readiness filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Readiness</label>
            <select
              value={filters.readiness || ""}
              onChange={(e) => setFilters({ ...filters, readiness: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="READY">Ready</option>
              <option value="CONDITIONAL">Conditional</option>
              <option value="NOT_READY">Not Ready</option>
            </select>
          </div>

          {/* Opportunity Score range */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Opportunity Score</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.scoreMin || ""}
                onChange={(e) => setFilters({ ...filters, scoreMin: e.target.value ? parseInt(e.target.value) : null })}
                className="w-1/2 border rounded px-3 py-2 text-sm"
                min="0"
                max="100"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.scoreMax || ""}
                onChange={(e) => setFilters({ ...filters, scoreMax: e.target.value ? parseInt(e.target.value) : null })}
                className="w-1/2 border rounded px-3 py-2 text-sm"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Timeline Window filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Timeline Window</label>
            <select
              value={filters.timelineWindow || ""}
              onChange={(e) => setFilters({ ...filters, timelineWindow: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="qa">Q&A Window Active</option>
              <option value="submission">Submission Window Active</option>
              <option value="demo">Demo Window Active</option>
              <option value="award">Award Date Upcoming</option>
            </select>
          </div>

          {/* Boolean filters */}
          <div className="mb-4 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.hasUnansweredQuestions}
                onChange={(e) => setFilters({ ...filters, hasUnansweredQuestions: e.target.checked })}
                className="rounded"
              />
              Has unanswered questions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.hasOverdueTasks}
                onChange={(e) => setFilters({ ...filters, hasOverdueTasks: e.target.checked })}
                className="rounded"
              />
              Has overdue tasks
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={applyFilters}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
