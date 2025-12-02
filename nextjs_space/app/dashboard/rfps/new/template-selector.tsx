/**
 * STEP 38A: RFP Template Selector Component
 * 
 * Optional step in RFP creation wizard to select and apply a template
 * Buyer-only feature with Option 3 indicators
 */

"use client";

import { useState, useEffect } from "react";
import { Check, FileText, Loader2, AlertCircle } from "lucide-react";

type QuestionType = "text" | "textarea" | "number" | "date" | "select" | "multiselect";

interface TemplateQuestion {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

interface TemplateSubsection {
  id: string;
  title: string;
  description?: string;
  questions: TemplateQuestion[];
  order: number;
}

interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  subsections: TemplateSubsection[];
  order: number;
}

interface TemplateStructure {
  version: number;
  sections: TemplateSection[];
  metadata: {
    createdAt: string;
    lastModified: string;
  };
}

interface Template {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  structureJson: TemplateStructure;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    description?: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface TemplateSelectorProps {
  rfpId?: string; // If applying to existing RFP
  onTemplateApplied?: (templateId: string) => void;
  className?: string;
}

export function TemplateSelector({ rfpId, onTemplateApplied, className = "" }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch("/api/dashboard/rfp-templates");
      
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = async () => {
    if (!rfpId || !selectedTemplate) {
      setError("Please select a template and ensure RFP ID is provided");
      return;
    }

    try {
      setIsApplying(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/dashboard/rfp-templates/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfpId,
          templateId: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply template");
      }

      setSuccessMessage(data.message || "Template applied successfully!");
      
      if (onTemplateApplied) {
        onTemplateApplied(selectedTemplate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setIsApplying(false);
    }
  };

  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter((t) => t.categoryId === selectedCategory);

  const getTemplateStats = (template: Template) => {
    const sections = template.structureJson.sections.length;
    const subsections = template.structureJson.sections.reduce(
      (acc, s) => acc + s.subsections.length,
      0
    );
    const questions = template.structureJson.sections.reduce(
      (acc, s) => acc + s.subsections.reduce((acc2, ss) => acc2 + ss.questions.length, 0),
      0
    );
    return { sections, subsections, questions };
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* STEP 38A: Option 3 Indicator */}
      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start">
        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-purple-900">Option 3: Premium Feature</span>
          <p className="text-purple-700 mt-1">
            RFP Templates accelerate your workflow with pre-built question structures. 
            This feature is part of Fyndr's Premium tier.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Select an RFP Template (Optional)
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No templates available in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => {
            const stats = getTemplateStats(template);
            const isSelected = selectedTemplate === template.id;
            const isExpanded = expandedTemplate === template.id;

            return (
              <div
                key={template.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Category: {template.category.name}
                        </p>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-2 ml-8">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 ml-8 text-xs text-gray-500">
                      <span>{stats.sections} sections</span>
                      <span>•</span>
                      <span>{stats.subsections} subsections</span>
                      <span>•</span>
                      <span>{stats.questions} questions</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTemplate(isExpanded ? null : template.id);
                    }}
                    className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {/* Expanded Template Details */}
                {isExpanded && (
                  <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3">Template Structure:</h5>
                    <div className="space-y-3">
                      {template.structureJson.sections.map((section, idx) => (
                        <div key={section.id} className="pl-2 border-l-2 border-gray-300">
                          <div className="font-medium text-gray-800">
                            {idx + 1}. {section.title}
                          </div>
                          {section.description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {section.description}
                            </div>
                          )}
                          <div className="ml-4 mt-2 space-y-2">
                            {section.subsections.map((subsection) => (
                              <div key={subsection.id}>
                                <div className="text-sm text-gray-700">
                                  • {subsection.title} ({subsection.questions.length} questions)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Button (only shown if rfpId is provided) */}
      {rfpId && selectedTemplate && (
        <div className="mt-6">
          <button
            type="button"
            onClick={applyTemplate}
            disabled={isApplying}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Applying Template...
              </>
            ) : (
              "Apply Selected Template"
            )}
          </button>
        </div>
      )}

      {!rfpId && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> After creating your RFP, you'll be able to apply this template 
            to pre-populate the structure and questions.
          </p>
        </div>
      )}
    </div>
  );
}
