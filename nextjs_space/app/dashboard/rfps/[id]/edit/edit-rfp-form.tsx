"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { STAGES } from "@/lib/stages";
import StageTransitionWarningModal from "../../components/stage-transition-warning-modal";
import { validateTimeline } from "@/lib/rfp-timeline";

type Company = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
};

type RFP = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  stage: string;
  dueDate: Date | null;
  submittedAt: Date | null;
  budget: number | null;
  priority: string;
  internalNotes: string | null;
  companyId: string;
  supplierId: string;
  company: Company;
  supplier: Supplier;
  // Timeline fields (STEP 14)
  askQuestionsStart: Date | null;
  askQuestionsEnd: Date | null;
  submissionStart: Date | null;
  submissionEnd: Date | null;
  demoWindowStart: Date | null;
  demoWindowEnd: Date | null;
  awardDate: Date | null;
};

type EditRFPFormProps = {
  rfp: RFP;
  companies: Company[];
  suppliers: Supplier[];
};

// Helper function to format date for input[type="date"]
function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EditRFPForm({ rfp, companies, suppliers }: EditRFPFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: rfp.title,
    description: rfp.description || "",
    status: rfp.status,
    stage: rfp.stage || "INTAKE",
    companyId: rfp.companyId,
    supplierId: rfp.supplierId,
    dueDate: formatDateForInput(rfp.dueDate),
    submittedAt: formatDateForInput(rfp.submittedAt),
    budget: rfp.budget?.toString() || "",
    priority: rfp.priority || "MEDIUM",
    internalNotes: rfp.internalNotes || "",
    // Timeline fields (STEP 14)
    askQuestionsStart: formatDateForInput(rfp.askQuestionsStart),
    askQuestionsEnd: formatDateForInput(rfp.askQuestionsEnd),
    submissionStart: formatDateForInput(rfp.submissionStart),
    submissionEnd: formatDateForInput(rfp.submissionEnd),
    demoWindowStart: formatDateForInput(rfp.demoWindowStart),
    demoWindowEnd: formatDateForInput(rfp.demoWindowEnd),
    awardDate: formatDateForInput(rfp.awardDate),
  });

  // Track original stage for validation
  const originalStage = rfp.stage || "INTAKE";

  // Timeline section collapsible state
  const [isTimelineSectionOpen, setIsTimelineSectionOpen] = useState(false);

  // Modal state for stage transition warnings
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent, override = false) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.companyId) {
      setError("Please select a company");
      return;
    }

    if (!formData.supplierId) {
      setError("Please select a supplier");
      return;
    }

    // Validate budget if provided
    if (formData.budget && parseFloat(formData.budget) < 0) {
      setError("Budget must be a positive number");
      return;
    }

    // Validate timeline configuration (STEP 14)
    const timelineError = validateTimeline({
      askQuestionsStart: formData.askQuestionsStart ? new Date(formData.askQuestionsStart) : null,
      askQuestionsEnd: formData.askQuestionsEnd ? new Date(formData.askQuestionsEnd) : null,
      submissionStart: formData.submissionStart ? new Date(formData.submissionStart) : null,
      submissionEnd: formData.submissionEnd ? new Date(formData.submissionEnd) : null,
      demoWindowStart: formData.demoWindowStart ? new Date(formData.demoWindowStart) : null,
      demoWindowEnd: formData.demoWindowEnd ? new Date(formData.demoWindowEnd) : null,
      awardDate: formData.awardDate ? new Date(formData.awardDate) : null,
    });

    if (timelineError) {
      setError(timelineError);
      return;
    }

    // Check if stage has changed and validate transition
    const stageChanged = formData.stage !== originalStage;

    if (stageChanged && !override) {
      setIsLoading(true);
      try {
        const validationRes = await fetch(`/api/rfps/${rfp.id}/validate-transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStage: formData.stage })
        });

        if (!validationRes.ok) {
          throw new Error('Failed to validate transition');
        }

        const validation = await validationRes.json();

        // If not allowed or has warnings, show modal
        if (!validation.allowed || validation.warning) {
          setValidationResult(validation);
          setPendingFormData(formData);
          setShowWarningModal(true);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setError('Failed to validate stage transition. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Proceed with update
    await submitForm(override);
  };

  // Helper function to submit the form
  const submitForm = async (override = false) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/rfps/${rfp.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          stage: formData.stage,
          dueDate: formData.dueDate || null,
          submittedAt: formData.submittedAt || null,
          budget: formData.budget || null,
          priority: formData.priority,
          internalNotes: formData.internalNotes,
          // Timeline fields (STEP 14)
          askQuestionsStart: formData.askQuestionsStart || null,
          askQuestionsEnd: formData.askQuestionsEnd || null,
          submissionStart: formData.submissionStart || null,
          submissionEnd: formData.submissionEnd || null,
          demoWindowStart: formData.demoWindowStart || null,
          demoWindowEnd: formData.demoWindowEnd || null,
          awardDate: formData.awardDate || null,
          override,
          overrideReason: override ? "User override from Edit Form" : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update RFP");
      }

      // Success! Redirect to the RFP detail page
      router.push(`/dashboard/rfps/${rfp.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update RFP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal confirmation
  const handleModalConfirm = async () => {
    setShowWarningModal(false);
    await submitForm(true);
    setPendingFormData(null);
    setValidationResult(null);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setShowWarningModal(false);
    setPendingFormData(null);
    setValidationResult(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter RFP title"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="companyId"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Company <span className="text-red-500">*</span>
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="supplierId"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Supplier <span className="text-red-500">*</span>
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="stage"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Stage
          </label>
          <select
            id="stage"
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {STAGES.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical"
          placeholder="Enter RFP description (optional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="submittedAt"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Submitted At
          </label>
          <input
            type="date"
            id="submittedAt"
            name="submittedAt"
            value={formData.submittedAt}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="budget"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Budget (USD)
          </label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            disabled={isLoading}
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter budget amount"
          />
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="internalNotes"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Internal Notes
          <span className="ml-2 text-xs text-gray-500 font-normal">(Internal use only)</span>
        </label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          value={formData.internalNotes}
          onChange={handleChange}
          disabled={isLoading}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical"
          placeholder="Add internal notes (optional)"
        />
      </div>

      {/* RFP Timeline & Milestones Section (STEP 14) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsTimelineSectionOpen(!isTimelineSectionOpen)}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">
              RFP Timeline & Milestones
            </h3>
            <span className="text-xs text-gray-500 font-normal">
              (Optional - Define supplier timeline windows)
            </span>
          </div>
          {isTimelineSectionOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {isTimelineSectionOpen && (
          <div className="p-6 space-y-6 bg-white">
            <p className="text-sm text-gray-600 mb-4">
              Set key dates for supplier engagement windows. These dates will be displayed on the RFP detail page
              and help track important milestones throughout the RFP lifecycle.
            </p>

            {/* Questions Period */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Questions Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="askQuestionsStart" className="block text-sm font-medium text-gray-700 mb-2">
                    Questions Open
                  </label>
                  <input
                    type="date"
                    id="askQuestionsStart"
                    name="askQuestionsStart"
                    value={formData.askQuestionsStart}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="askQuestionsEnd" className="block text-sm font-medium text-gray-700 mb-2">
                    Questions Close
                  </label>
                  <input
                    type="date"
                    id="askQuestionsEnd"
                    name="askQuestionsEnd"
                    value={formData.askQuestionsEnd}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Submission Period */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Submission Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="submissionStart" className="block text-sm font-medium text-gray-700 mb-2">
                    Submissions Open
                  </label>
                  <input
                    type="date"
                    id="submissionStart"
                    name="submissionStart"
                    value={formData.submissionStart}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="submissionEnd" className="block text-sm font-medium text-gray-700 mb-2">
                    Submissions Due
                  </label>
                  <input
                    type="date"
                    id="submissionEnd"
                    name="submissionEnd"
                    value={formData.submissionEnd}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Demo Window */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Demo Window</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="demoWindowStart" className="block text-sm font-medium text-gray-700 mb-2">
                    Demo Window Start
                  </label>
                  <input
                    type="date"
                    id="demoWindowStart"
                    name="demoWindowStart"
                    value={formData.demoWindowStart}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="demoWindowEnd" className="block text-sm font-medium text-gray-700 mb-2">
                    Demo Window End
                  </label>
                  <input
                    type="date"
                    id="demoWindowEnd"
                    name="demoWindowEnd"
                    value={formData.demoWindowEnd}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Award Date */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Award Date</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="awardDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Award Date
                  </label>
                  <input
                    type="date"
                    id="awardDate"
                    name="awardDate"
                    value={formData.awardDate}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Updating...
            </>
          ) : (
            "Update RFP"
          )}
        </button>
        <Link
          href={`/dashboard/rfps/${rfp.id}`}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Cancel
        </Link>
      </div>

      {/* Stage Transition Warning Modal */}
      <StageTransitionWarningModal
        isOpen={showWarningModal}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        warning={validationResult?.warning || null}
        incompleteTasks={validationResult?.requiredTasksIncomplete || []}
      />
    </form>
  );
}
