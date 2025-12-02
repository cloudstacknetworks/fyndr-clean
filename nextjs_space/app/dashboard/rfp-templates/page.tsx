"use client";

/**
 * app/dashboard/rfp-templates/page.tsx
 * 
 * STEP 38A/38B: RFP Template Manager
 * 
 * Central hub for managing RFP templates and clause library:
 * - List all templates
 * - Create new templates
 * - Edit templates (navigate to editor)
 * - Manage clause library
 * - Apply templates to RFPs
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Edit,
  Eye,
  Copy,
  Trash2,
  Lock,
  Unlock,
  BookOpen,
  Layers,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface TemplateCategory {
  id: string;
  name: string;
  description: string | null;
}

interface RfpTemplate {
  id: string;
  categoryId: string;
  category: TemplateCategory;
  title: string;
  description: string | null;
  version: number;
  isActive: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TemplateManagerPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<RfpTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/rfp-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.categoryId === selectedCategory);

  const handleEditTemplate = (templateId: string) => {
    router.push(`/dashboard/rfp-templates/${templateId}/edit`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      fetchTemplates();
    } catch (err: any) {
      alert(`Error deleting template: ${err.message}`);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          RFP Template Manager
        </h1>
        <p className="text-gray-600">
          Create, manage, and customize RFP templates with reusable clauses
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link
          href="/dashboard/rfp-templates/clauses"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Clause Library
          </h3>
          <p className="text-sm text-gray-600">
            Manage reusable clauses for your templates
          </p>
        </Link>

        <button
          onClick={() => router.push("/dashboard/rfp-templates/new")}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Create Template
          </h3>
          <p className="text-sm text-gray-600">
            Start building a new RFP template
          </p>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {templates.length} Templates
          </h3>
          <p className="text-sm text-gray-600">
            {templates.filter((t) => t.isActive).length} active,{" "}
            {templates.filter((t) => !t.isActive).length} inactive
          </p>
        </div>
      </div>

      {/* Filter by Category */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            Showing {filteredTemplates.length} template(s)
          </span>
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

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory !== "all"
              ? "No templates in this category"
              : "Get started by creating your first template"}
          </p>
          {selectedCategory === "all" && (
            <button
              onClick={() => router.push("/dashboard/rfp-templates/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {template.category.name}
                  </p>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    template.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {template.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  v{template.version}
                </span>
                {template.isEditable ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <Unlock className="h-3 w-3" />
                    Editable
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Updated: {new Date(template.updatedAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTemplate(template.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  title="Edit Template"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() =>
                    router.push(`/dashboard/rfp-templates/${template.id}/preview`)
                  }
                  className="flex items-center justify-center px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="flex items-center justify-center px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
