"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertCircle, RefreshCw, Loader2, Mail } from "lucide-react";
import ShareSummaryModal from "./share-summary-modal";
import SharePreviewModal from "./share-preview-modal";
import { generateSummaryEmailHtml } from "@/lib/email-templates";

interface AISummary {
  overview: string;
  goals: string;
  dates: string;
  budget: string;
  risks: string;
}

interface AISummaryProps {
  rfpId: string;
  rfpTitle: string;
}

type TemplateType = 'concise' | 'executive' | 'detailed';

export default function AISummary({ rfpId, rfpTitle }: AISummaryProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // State for edited summary content
  const [editedSummary, setEditedSummary] = useState<AISummary>({
    overview: '',
    goals: '',
    dates: '',
    budget: '',
    risks: ''
  });

  // State for template management
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('executive');
  const [hasUserEdits, setHasUserEdits] = useState(false);
  
  // State for preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Update editedSummary when summary changes (after generation/regeneration)
  useEffect(() => {
    if (summary) {
      const formatted = formatSummary(summary, activeTemplate);
      setEditedSummary(formatted);
      setHasUserEdits(false); // Reset edit flag on new generation
    }
  }, [summary]);

  // Format summary text into concise bullet points (3-5 bullets per section)
  const formatConcise = (summary: AISummary): AISummary => {
    const extractKeyPoints = (text: string, maxPoints: number = 4): string => {
      // Split into sentences
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Take first 3-4 most important sentences
      const keyPoints = sentences.slice(0, maxPoints);
      
      // Format as bullet points
      return keyPoints.map(point => `• ${point.trim()}`).join('\n');
    };

    return {
      overview: extractKeyPoints(summary.overview, 4),
      goals: extractKeyPoints(summary.goals, 4),
      dates: extractKeyPoints(summary.dates, 3),
      budget: extractKeyPoints(summary.budget, 3),
      risks: extractKeyPoints(summary.risks, 4)
    };
  };

  // Keep executive format as-is (default format from API)
  const formatExecutive = (summary: AISummary): AISummary => {
    return { ...summary };
  };

  // Expand content to detailed format (3-5 paragraphs per section)
  const formatDetailed = (summary: AISummary): AISummary => {
    const expandContent = (text: string): string => {
      // Split into paragraphs
      const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
      
      if (paragraphs.length === 1) {
        // If single paragraph, split into sentences and expand
        const sentences = paragraphs[0].split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Group sentences into logical paragraphs (2-3 sentences each)
        const expandedParagraphs: string[] = [];
        for (let i = 0; i < sentences.length; i += 2) {
          const group = sentences.slice(i, i + 2).map(s => s.trim() + '.').join(' ');
          expandedParagraphs.push(group);
        }
        
        // Add context sentences
        const contextIntro = "This section requires careful consideration and detailed analysis.";
        const contextConclusion = "Further investigation and stakeholder input may be necessary to fully address these aspects.";
        
        return [contextIntro, ...expandedParagraphs, contextConclusion].join('\n\n');
      }
      
      // If already multiple paragraphs, add contextual expansions
      const contextIntro = "Detailed Analysis:\n\n";
      const contextConclusion = "\n\nRecommendations: These findings should be reviewed by relevant stakeholders to ensure alignment with organizational goals and risk tolerance.";
      
      return contextIntro + paragraphs.join('\n\n') + contextConclusion;
    };

    return {
      overview: expandContent(summary.overview),
      goals: expandContent(summary.goals),
      dates: expandContent(summary.dates),
      budget: expandContent(summary.budget),
      risks: expandContent(summary.risks)
    };
  };

  // Main formatting function
  const formatSummary = (summary: AISummary, template: TemplateType): AISummary => {
    switch (template) {
      case 'concise':
        return formatConcise(summary);
      case 'detailed':
        return formatDetailed(summary);
      case 'executive':
      default:
        return formatExecutive(summary);
    }
  };

  // Handle template switching with confirmation if user has edits
  const handleTemplateSwitch = (newTemplate: TemplateType) => {
    if (activeTemplate === newTemplate) return;

    if (hasUserEdits) {
      const confirmed = window.confirm(
        'Switching templates will reset your edited text. Continue?'
      );
      if (!confirmed) return;
    }

    // Switch template
    setActiveTemplate(newTemplate);

    // Reformat summary based on template
    if (summary) {
      const reformatted = formatSummary(summary, newTemplate);
      setEditedSummary(reformatted);
      setHasUserEdits(false); // Reset edit flag
    }
  };

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rfps/${rfpId}/summary`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  // Handle inline editing of sections
  const handleEdit = (section: keyof AISummary, event: React.FormEvent<HTMLDivElement>) => {
    const newContent = event.currentTarget.textContent || '';
    setEditedSummary(prev => ({
      ...prev,
      [section]: newContent
    }));
    setHasUserEdits(true); // Mark that user has edited content
  };

  const handleRetry = () => {
    setError(null);
    handleGenerateSummary();
  };
  
  // Handle Share button click - Open preview modal first
  const handleShareClick = () => {
    // Generate email HTML with current template and edits
    const templateNameForEmail = 
      activeTemplate === 'concise' ? 'Concise' : 
      activeTemplate === 'detailed' ? 'Detailed' : 'Executive';
    
    const html = generateSummaryEmailHtml(
      rfpTitle,
      editedSummary,
      templateNameForEmail
    );
    
    setPreviewHtml(html);
    setShowPreview(true);
  };
  
  // Handle preview continue - Open recipients modal
  const handlePreviewContinue = () => {
    setShowPreview(false);
    setIsShareModalOpen(true);
  };
  
  // Handle preview cancel - Close preview modal
  const handlePreviewCancel = () => {
    setShowPreview(false);
  };

  return (
    <div className="mt-8">
      {/* Generate Button */}
      {!summary && !loading && (
        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-5 w-5" />
          Generate Executive Summary
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
            <p className="text-purple-900 font-medium">
              Generating executive summary...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-900 font-semibold mb-1">
                Failed to Generate Summary
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Summary Display */}
      {summary && !loading && (
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">
                  AI Executive Summary
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareClick}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={handleGenerateSummary}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Template Switching Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-6">
            <button
              onClick={() => handleTemplateSwitch('concise')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTemplate === 'concise'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Concise
            </button>
            <button
              onClick={() => handleTemplateSwitch('executive')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTemplate === 'executive'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Executive
            </button>
            <button
              onClick={() => handleTemplateSwitch('detailed')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTemplate === 'detailed'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Detailed
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* High-Level Overview */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    High-Level Overview
                  </h3>
                  <div
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleEdit('overview', e)}
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap p-3 rounded-lg border border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500 focus:outline-none transition"
                  >
                    {editedSummary.overview}
                  </div>
                </div>
              </div>
            </div>

            {/* Goals & Requirements */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Goals & Requirements
                  </h3>
                  <div
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleEdit('goals', e)}
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap p-3 rounded-lg border border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500 focus:outline-none transition"
                  >
                    {editedSummary.goals}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Dates & Deadlines */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Key Dates & Deadlines
                  </h3>
                  <div
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleEdit('dates', e)}
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap p-3 rounded-lg border border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500 focus:outline-none transition"
                  >
                    {editedSummary.dates}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget & Constraints */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-green-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Budget & Constraints
                  </h3>
                  <div
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleEdit('budget', e)}
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap p-3 rounded-lg border border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500 focus:outline-none transition"
                  >
                    {editedSummary.budget}
                  </div>
                </div>
              </div>
            </div>

            {/* Risks & Considerations */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold text-lg">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Risks & Considerations
                  </h3>
                  <div
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleEdit('risks', e)}
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap p-3 rounded-lg border border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500 focus:outline-none transition"
                  >
                    {editedSummary.risks}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Preview Modal */}
      {summary && (
        <SharePreviewModal
          isOpen={showPreview}
          onClose={handlePreviewCancel}
          onContinue={handlePreviewContinue}
          emailHtml={previewHtml}
          rfpTitle={rfpTitle}
          templateName={
            activeTemplate === 'concise' ? 'Concise' : 
            activeTemplate === 'detailed' ? 'Detailed' : 'Executive'
          }
        />
      )}
      
      {/* Share Summary Modal */}
      {summary && (
        <ShareSummaryModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          rfpId={rfpId}
          rfpTitle={rfpTitle}
          summary={editedSummary}
          templateName={
            activeTemplate === 'concise' ? 'Concise' : 
            activeTemplate === 'detailed' ? 'Detailed' : 'Executive'
          }
        />
      )}
    </div>
  );
}
