"use client";

/**
 * app/dashboard/rfp-templates/[id]/edit/page.tsx
 * 
 * STEP 38B: Template Editor - 3-Panel Layout
 * 
 * Comprehensive template editing interface:
 * - Left Panel: Template structure tree (sections, subsections, questions)
 * - Center Panel: Content editor with live editing
 * - Right Panel: Clause library browser for drag-and-drop
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  GripVertical,
  BookOpen,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface TemplateQuestion {
  id: string;
  text: string;
  description?: string;
  type: string;
  required: boolean;
  order: number;
}

interface TemplateSubsection {
  id: string;
  title: string;
  order: number;
  questions?: TemplateQuestion[];
}

interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  subsections?: TemplateSubsection[];
}

interface TemplateStructure {
  sections: TemplateSection[];
}

interface ClauseLibraryItem {
  id: string;
  title: string;
  description: string;
  body: string;
  isRequired: boolean;
  clauseType: string;
  category?: {
    id: string;
    name: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [structure, setStructure] = useState<TemplateStructure>({ sections: [] });
  const [clauses, setClauses] = useState<ClauseLibraryItem[]>([]);
  const [linkedClauses, setLinkedClauses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Load template, structure, and clauses
  useEffect(() => {
    loadTemplateData();
    loadClauses();
  }, [templateId]);

  const loadTemplateData = async () => {
    try {
      setLoading(true);
      
      // Load template details
      const templateRes = await fetch(`/api/dashboard/rfp-templates/${templateId}`);
      if (!templateRes.ok) throw new Error("Failed to load template");
      const templateData = await templateRes.json();
      setTemplate(templateData.template);

      // Load template structure
      const structureRes = await fetch(`/api/dashboard/rfp-templates/${templateId}/structure`);
      if (!structureRes.ok) throw new Error("Failed to load structure");
      const structureData = await structureRes.json();
      setStructure(structureData.structure || { sections: [] });

      // Load linked clauses
      const clausesRes = await fetch(`/api/dashboard/rfp-templates/${templateId}/clauses`);
      if (!clausesRes.ok) throw new Error("Failed to load linked clauses");
      const clausesData = await clausesRes.json();
      setLinkedClauses(clausesData.clauseLinks.map((link: any) => link.clauseId));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClauses = async () => {
    try {
      const response = await fetch("/api/dashboard/clauses");
      if (!response.ok) throw new Error("Failed to load clauses");
      const data = await response.json();
      setClauses(data.clauses || []);
    } catch (err: any) {
      console.error("Error loading clauses:", err);
    }
  };

  const handleSaveStructure = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          structure,
        }),
      });

      if (!response.ok) throw new Error("Failed to save structure");

      alert("Template saved successfully!");
    } catch (err: any) {
      alert(`Error saving template: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async (title: string, description?: string) => {
    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSection",
          title,
          description,
        }),
      });

      if (!response.ok) throw new Error("Failed to add section");

      await loadTemplateData();
      setShowAddSectionModal(false);
    } catch (err: any) {
      alert(`Error adding section: ${err.message}`);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteSection",
          sectionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete section");

      await loadTemplateData();
    } catch (err: any) {
      alert(`Error deleting section: ${err.message}`);
    }
  };

  const handleAddSubsection = async (sectionId: string, title: string) => {
    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSubsection",
          sectionId,
          title,
        }),
      });

      if (!response.ok) throw new Error("Failed to add subsection");

      await loadTemplateData();
    } catch (err: any) {
      alert(`Error adding subsection: ${err.message}`);
    }
  };

  const handleAddQuestion = async (
    sectionId: string,
    subsectionId: string,
    question: Omit<TemplateQuestion, "id" | "order">
  ) => {
    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addQuestion",
          sectionId,
          subsectionId,
          question,
        }),
      });

      if (!response.ok) throw new Error("Failed to add question");

      await loadTemplateData();
      setShowAddQuestionModal(false);
    } catch (err: any) {
      alert(`Error adding question: ${err.message}`);
    }
  };

  const handleLinkClause = async (clauseId: string) => {
    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/clauses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "link",
          clauseId,
          required: false,
        }),
      });

      if (!response.ok) throw new Error("Failed to link clause");

      setLinkedClauses([...linkedClauses, clauseId]);
      alert("Clause linked successfully!");
    } catch (err: any) {
      alert(`Error linking clause: ${err.message}`);
    }
  };

  const handleUnlinkClause = async (clauseId: string) => {
    try {
      const response = await fetch(`/api/dashboard/rfp-templates/${templateId}/clauses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlink",
          clauseId,
        }),
      });

      if (!response.ok) throw new Error("Failed to unlink clause");

      setLinkedClauses(linkedClauses.filter((id) => id !== clauseId));
      alert("Clause unlinked successfully!");
    } catch (err: any) {
      alert(`Error unlinking clause: ${err.message}`);
    }
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-red-700">{error || "Template not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/rfp-templates")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{template.title}</h1>
              <p className="text-sm text-gray-600">
                v{template.version} • {template.isEditable ? "Editable" : "Locked"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveStructure}
              disabled={saving || !template.isEditable}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Structure Tree */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Structure</h2>
              <button
                onClick={() => setShowAddSectionModal(true)}
                disabled={!template.isEditable}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {structure.sections.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No sections yet. Add your first section to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {structure.sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg">
                    <div
                      className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedSection === section.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => {
                        setSelectedSection(section.id);
                        toggleSectionExpansion(section.id);
                      }}
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="flex-1 font-medium text-sm text-gray-900">
                        {section.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.id);
                        }}
                        disabled={!template.isEditable}
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {expandedSections.has(section.id) && (
                      <div className="p-2 bg-gray-50 border-t border-gray-200">
                        {section.subsections && section.subsections.length > 0 ? (
                          <div className="space-y-1">
                            {section.subsections.map((subsection) => (
                              <div
                                key={subsection.id}
                                className={`p-2 rounded text-sm cursor-pointer hover:bg-white ${
                                  selectedSubsection === subsection.id
                                    ? "bg-white border border-indigo-200"
                                    : ""
                                }`}
                                onClick={() => setSelectedSubsection(subsection.id)}
                              >
                                {subsection.title}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({subsection.questions?.length || 0} questions)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 py-2">No subsections</p>
                        )}
                        <button
                          onClick={() => {
                            const title = prompt("Subsection title:");
                            if (title) handleAddSubsection(section.id, title);
                          }}
                          disabled={!template.isEditable}
                          className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                          Add Subsection
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL - Content Editor */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-6">
            {selectedSection ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {structure.sections.find((s) => s.id === selectedSection)?.title}
                </h2>
                {selectedSubsection ? (
                  <SubsectionEditor
                    section={structure.sections.find((s) => s.id === selectedSection)!}
                    subsection={
                      structure.sections
                        .find((s) => s.id === selectedSection)
                        ?.subsections?.find((ss) => ss.id === selectedSubsection)!
                    }
                    onAddQuestion={() => setShowAddQuestionModal(true)}
                    isEditable={template.isEditable}
                  />
                ) : (
                  <p className="text-gray-600">
                    Select a subsection to view and edit its content
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a section to start editing
                </h3>
                <p className="text-gray-600">
                  Choose a section from the left panel to view and edit its content
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Clause Library */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Clause Library
            </h2>

            {clauses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No clauses available
              </p>
            ) : (
              <div className="space-y-3">
                {clauses.map((clause) => {
                  const isLinked = linkedClauses.includes(clause.id);
                  return (
                    <div
                      key={clause.id}
                      className={`p-3 rounded-lg border ${
                        isLinked
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {clause.title}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {clause.clauseType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {clause.description}
                      </p>
                      <button
                        onClick={() =>
                          isLinked
                            ? handleUnlinkClause(clause.id)
                            : handleLinkClause(clause.id)
                        }
                        disabled={!template.isEditable}
                        className={`w-full px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 ${
                          isLinked
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {isLinked ? "Unlink" : "Link to Template"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddSectionModal && (
        <AddSectionModal
          onClose={() => setShowAddSectionModal(false)}
          onAdd={handleAddSection}
        />
      )}

      {showAddQuestionModal && selectedSection && selectedSubsection && (
        <AddQuestionModal
          onClose={() => setShowAddQuestionModal(false)}
          onAdd={(question) =>
            handleAddQuestion(selectedSection, selectedSubsection, question)
          }
        />
      )}
    </div>
  );
}

// ============================================================================
// SUBSECTION EDITOR COMPONENT
// ============================================================================

interface SubsectionEditorProps {
  section: TemplateSection;
  subsection: TemplateSubsection;
  onAddQuestion: () => void;
  isEditable: boolean;
}

function SubsectionEditor({
  section,
  subsection,
  onAddQuestion,
  isEditable,
}: SubsectionEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{subsection.title}</h3>
        <button
          onClick={onAddQuestion}
          disabled={!isEditable}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {subsection.questions && subsection.questions.length > 0 ? (
        <div className="space-y-4">
          {subsection.questions.map((question, index) => (
            <div
              key={question.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Q{index + 1}. {question.text}
                </span>
                {question.required && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    Required
                  </span>
                )}
              </div>
              {question.description && (
                <p className="text-sm text-gray-600 mb-2">{question.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Type: {question.type}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center py-8">
          No questions yet. Add your first question to get started.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// ADD SECTION MODAL
// ============================================================================

interface AddSectionModalProps {
  onClose: () => void;
  onAdd: (title: string, description?: string) => void;
}

function AddSectionModal({ onClose, onAdd }: AddSectionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title, description || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Section</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// ADD QUESTION MODAL
// ============================================================================

interface AddQuestionModalProps {
  onClose: () => void;
  onAdd: (question: Omit<TemplateQuestion, "id" | "order">) => void;
}

function AddQuestionModal({ onClose, onAdd }: AddQuestionModalProps) {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd({
        text,
        description: description || undefined,
        type,
        required,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Question</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Text *
            </label>
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="text">Short Text</option>
              <option value="textarea">Long Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
              <option value="multiselect">Multi-select</option>
              <option value="file">File Upload</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="required" className="text-sm text-gray-700">
              Required question
            </label>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
