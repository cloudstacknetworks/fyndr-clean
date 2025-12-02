"use client";

/**
 * app/dashboard/rfp-templates/clauses/page.tsx
 * 
 * STEP 38B: Clause Library Manager
 * 
 * Full CRUD interface for managing reusable clauses:
 * - List all clauses with filtering by category and type
 * - Create new clauses
 * - Edit existing clauses
 * - Delete clauses
 * - Preview clause content
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  DollarSign,
  Lock,
  FileCode,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ClauseCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

interface ClauseLibraryItem {
  id: string;
  categoryId: string;
  category?: ClauseCategory;
  title: string;
  description: string;
  body: string;
  isRequired: boolean;
  clauseType: "legal" | "commercial" | "security" | "sow" | "other";
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

export default function ClauseLibraryPage() {
  const [clauses, setClauses] = useState<ClauseLibraryItem[]>([]);
  const [filteredClauses, setFilteredClauses] = useState<ClauseLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedClause, setSelectedClause] = useState<ClauseLibraryItem | null>(null);
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  // Fetch clauses on mount
  useEffect(() => {
    fetchClauses();
  }, []);

  // Filter clauses whenever search/filter criteria change
  useEffect(() => {
    filterClauses();
  }, [clauses, searchQuery, selectedType, selectedCategory]);

  const fetchClauses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/clauses");
      if (!response.ok) {
        throw new Error("Failed to fetch clauses");
      }
      const data = await response.json();
      setClauses(data.clauses || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterClauses = () => {
    let filtered = [...clauses];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.body.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((c) => c.clauseType === selectedType);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.categoryId === selectedCategory);
    }

    setFilteredClauses(filtered);
  };

  const handleDeleteClause = async (clauseId: string) => {
    if (!confirm("Are you sure you want to delete this clause?")) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/clauses/${clauseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete clause");
      }

      // Refresh clauses
      fetchClauses();
    } catch (err: any) {
      alert(`Error deleting clause: ${err.message}`);
    }
  };

  const getClauseTypeIcon = (type: string) => {
    switch (type) {
      case "legal":
        return <Shield className="h-4 w-4" />;
      case "commercial":
        return <DollarSign className="h-4 w-4" />;
      case "security":
        return <Lock className="h-4 w-4" />;
      case "sow":
        return <FileCode className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getClauseTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      legal: "bg-blue-100 text-blue-800",
      commercial: "bg-green-100 text-green-800",
      security: "bg-red-100 text-red-800",
      sow: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          colors[type] || colors.other
        }`}
      >
        {getClauseTypeIcon(type)}
        {type.toUpperCase()}
      </span>
    );
  };

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(clauses.map((c) => c.category).filter(Boolean))
  ) as ClauseCategory[];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Clause Library</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Clause
          </button>
        </div>
        <p className="text-gray-600">
          Manage reusable clauses for RFP templates
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clauses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="legal">Legal</option>
              <option value="commercial">Commercial</option>
              <option value="security">Security</option>
              <option value="sow">SOW</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredClauses.length} of {clauses.length} clauses
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Clauses List */}
      {filteredClauses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No clauses found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedType !== "all" || selectedCategory !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first clause"}
          </p>
          {!searchQuery && selectedType === "all" && selectedCategory === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Your First Clause
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClauses.map((clause) => (
            <div
              key={clause.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {clause.title}
                    </h3>
                    {getClauseTypeBadge(clause.clauseType)}
                    {clause.isRequired && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {clause.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Category: {clause.category?.name || "N/A"}</span>
                    <span>•</span>
                    <span>
                      Updated: {new Date(clause.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Expandable body preview */}
                  {expandedClause === clause.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Clause Body:
                      </h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {clause.body}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() =>
                      setExpandedClause(
                        expandedClause === clause.id ? null : clause.id
                      )
                    }
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedClause === clause.id ? "Collapse" : "Expand"}
                  >
                    {expandedClause === clause.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClause(clause);
                      setShowPreviewModal(true);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClause(clause);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClause(clause.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ClauseFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchClauses();
          }}
        />
      )}

      {showEditModal && selectedClause && (
        <ClauseFormModal
          clause={selectedClause}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClause(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedClause(null);
            fetchClauses();
          }}
        />
      )}

      {showPreviewModal && selectedClause && (
        <ClausePreviewModal
          clause={selectedClause}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedClause(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// CLAUSE FORM MODAL (Create/Edit)
// ============================================================================

interface ClauseFormModalProps {
  clause?: ClauseLibraryItem;
  onClose: () => void;
  onSuccess: () => void;
}

function ClauseFormModal({ clause, onClose, onSuccess }: ClauseFormModalProps) {
  const [formData, setFormData] = useState({
    categoryId: clause?.categoryId || "",
    title: clause?.title || "",
    description: clause?.description || "",
    body: clause?.body || "",
    isRequired: clause?.isRequired || false,
    clauseType: clause?.clauseType || "other",
    order: clause?.order || 0,
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ClauseCategory[]>([]);

  useEffect(() => {
    // Fetch categories for the dropdown
    fetch("/api/dashboard/clauses")
      .then((res) => res.json())
      .then((data) => {
        const uniqueCategories = Array.from(
          new Set(data.clauses.map((c: any) => c.category).filter(Boolean))
        ) as ClauseCategory[];
        setCategories(uniqueCategories);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = clause
        ? `/api/dashboard/clauses/${clause.id}`
        : "/api/dashboard/clauses";
      const method = clause ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save clause");
      }

      onSuccess();
    } catch (err: any) {
      alert(`Error saving clause: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {clause ? "Edit Clause" : "Create New Clause"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clause Body *
              </label>
              <textarea
                required
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={formData.clauseType}
                  onChange={(e) =>
                    setFormData({ ...formData, clauseType: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="legal">Legal</option>
                  <option value="commercial">Commercial</option>
                  <option value="security">Security</option>
                  <option value="sow">SOW</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Is Required */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired}
                onChange={(e) =>
                  setFormData({ ...formData, isRequired: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isRequired" className="text-sm text-gray-700">
                This clause is required by default
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : clause ? "Update Clause" : "Create Clause"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CLAUSE PREVIEW MODAL
// ============================================================================

interface ClausePreviewModalProps {
  clause: ClauseLibraryItem;
  onClose: () => void;
}

function ClausePreviewModal({ clause, onClose }: ClausePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{clause.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Description
              </h3>
              <p className="text-gray-600">{clause.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Clause Body
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-700">
                {clause.body}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Type
                </h3>
                <p className="text-gray-600">{clause.clauseType.toUpperCase()}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Category
                </h3>
                <p className="text-gray-600">
                  {clause.category?.name || "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Status
              </h3>
              <p className="text-gray-600">
                {clause.isRequired ? "Required" : "Optional"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
