'use client';

/**
 * STEP 40: Executive Summary Workspace
 * 
 * Rich text editor with AI generation, version management, and export
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
  DocumentTextIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Option3Indicator } from '@/app/components/option3/option3-indicator';
import { ComparisonModal } from '@/app/components/executive-summary/comparison-modal';

// Dynamically import React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface ExecutiveSummary {
  id: string;
  title: string;
  content: string;
  tone: string;
  audience: string;
  version: number;
  isOfficial: boolean;
  generatedAt: string | null;
  autoSaveAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function ExecutiveSummaryWorkspace() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params?.id as string;

  const [summaries, setSummaries] = useState<ExecutiveSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<ExecutiveSummary | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Executive Summary');
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'analytical'>('professional');
  const [audience, setAudience] = useState<'executive' | 'technical' | 'procurement'>('executive');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Comparison state
  const [comparisonVersionA, setComparisonVersionA] = useState<string | null>(null);
  const [comparisonVersionB, setComparisonVersionB] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Fetch summaries on mount
  useEffect(() => {
    if (rfpId) {
      fetchSummaries();
    }
  }, [rfpId]);

  // Auto-save effect
  useEffect(() => {
    if (!selectedSummary || !content) return;

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [content, selectedSummary]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/executive-summaries`);
      if (!response.ok) throw new Error('Failed to fetch summaries');
      
      const data = await response.json();
      setSummaries(data.summaries || []);
      
      // Select the official summary or the latest one
      const official = data.summaries.find((s: ExecutiveSummary) => s.isOfficial);
      const latest = data.summaries[0];
      const toSelect = official || latest;
      
      if (toSelect) {
        setSelectedSummary(toSelect);
        setContent(toSelect.content);
        setTitle(toSelect.title);
        setTone(toSelect.tone as any);
        setAudience(toSelect.audience as any);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast.error('Failed to load summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/executive-summaries/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, audience, title }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      toast.success('Summary generated successfully!');
      
      // Add to list and select it
      setSummaries(prev => [data.summary, ...prev]);
      setSelectedSummary(data.summary);
      setContent(data.summary.content);
      setTitle(data.summary.title);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (!selectedSummary || autoSaving) return;

    try {
      setAutoSaving(true);
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/executive-summaries/${selectedSummary.id}/autosave`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) throw new Error('Failed to autosave');

      const data = await response.json();
      setLastSaved(new Date(data.autoSaveAt));
    } catch (error) {
      console.error('Error autosaving:', error);
      // Silent fail for autosave
    } finally {
      setAutoSaving(false);
    }
  }, [selectedSummary, content, rfpId, autoSaving]);

  const handleSaveFinal = async () => {
    if (!selectedSummary) return;

    try {
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/executive-summaries/${selectedSummary.id}/save-final`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to mark as final');

      toast.success('Summary marked as official!');
      fetchSummaries();
    } catch (error) {
      console.error('Error marking as final:', error);
      toast.error('Failed to mark as official');
    }
  };

  const handleClone = async () => {
    if (!selectedSummary) return;

    try {
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/executive-summaries/${selectedSummary.id}/clone`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to clone summary');

      const data = await response.json();
      toast.success('Summary cloned successfully!');
      
      setSummaries(prev => [data.summary, ...prev]);
      setSelectedSummary(data.summary);
      setContent(data.summary.content);
      setTitle(data.summary.title);
    } catch (error) {
      console.error('Error cloning summary:', error);
      toast.error('Failed to clone summary');
    }
  };

  const handleExportPDF = async () => {
    if (!selectedSummary) return;

    try {
      window.open(
        `/api/dashboard/rfps/${rfpId}/executive-summaries/${selectedSummary.id}/pdf`,
        '_blank'
      );
      toast.success('Exporting summary as PDF...');
    } catch (error) {
      console.error('Error exporting summary:', error);
      toast.error('Failed to export summary');
    }
  };

  const handleExportDocx = async () => {
    if (!selectedSummary) return;

    try {
      window.open(
        `/api/dashboard/rfps/${rfpId}/executive-summaries/${selectedSummary.id}/docx`,
        '_blank'
      );
      toast.success('Exporting summary as Word document...');
    } catch (error) {
      console.error('Error exporting summary:', error);
      toast.error('Failed to export summary');
    }
  };

  const handleDelete = async () => {
    if (!selectedSummary) return;
    if (!confirm('Are you sure you want to delete this summary?')) return;

    try {
      const response = await fetch(
        `/api/dashboard/rfps/${rfpId}/executive-summaries/${selectedSummary.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete summary');

      toast.success('Summary deleted');
      
      const remainingSummaries = summaries.filter(s => s.id !== selectedSummary.id);
      setSummaries(remainingSummaries);
      
      if (remainingSummaries.length > 0) {
        const next = remainingSummaries[0];
        setSelectedSummary(next);
        setContent(next.content);
        setTitle(next.title);
      } else {
        setSelectedSummary(null);
        setContent('');
        setTitle('Executive Summary');
      }
    } catch (error) {
      console.error('Error deleting summary:', error);
      toast.error('Failed to delete summary');
    }
  };

  const selectSummary = (summary: ExecutiveSummary) => {
    setSelectedSummary(summary);
    setContent(summary.content);
    setTitle(summary.title);
    setTone(summary.tone as any);
    setAudience(summary.audience as any);
  };

  const handleCompare = () => {
    if (!comparisonVersionA || !comparisonVersionB) {
      toast.error('Please select two versions to compare');
      return;
    }
    
    if (comparisonVersionA === comparisonVersionB) {
      toast.error('Please select two different versions');
      return;
    }
    
    setShowComparisonModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-demo="executive-summary-workspace">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/dashboard/rfps/${rfpId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-7 w-7 mr-2 text-blue-600" />
                  Executive Summary Workspace
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Generate, edit, and manage executive summaries for stakeholder communication
                </p>
              </div>
            </div>
            <Option3Indicator />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Version List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4" data-demo="version-list">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Versions</h2>
              
              {summaries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No summaries yet. Generate one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {summaries.map((summary) => (
                    <button
                      key={summary.id}
                      onClick={() => selectSummary(summary)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSummary?.id === summary.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          v{summary.version}
                        </span>
                        {summary.isOfficial && (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{summary.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compare Versions Panel */}
            {summaries.length >= 2 && (
              <div className="bg-white rounded-lg shadow p-4 mt-4" data-demo="compare-versions-panel">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ArrowsRightLeftIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Compare Versions
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Version A (Baseline)
                    </label>
                    <select
                      value={comparisonVersionA || ''}
                      onChange={(e) => setComparisonVersionA(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Select version</option>
                      {summaries.map((summary) => (
                        <option key={summary.id} value={summary.id}>
                          v{summary.version} - {new Date(summary.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Version B (Comparison)
                    </label>
                    <select
                      value={comparisonVersionB || ''}
                      onChange={(e) => setComparisonVersionB(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Select version</option>
                      {summaries.map((summary) => (
                        <option key={summary.id} value={summary.id}>
                          v{summary.version} - {new Date(summary.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleCompare}
                    disabled={!comparisonVersionA || !comparisonVersionB}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-demo="compare-button"
                  >
                    <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
                    Compare
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow" data-demo="editor-container">
              {/* Toolbar */}
              <div className="border-b border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as any)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="persuasive">Persuasive</option>
                      <option value="analytical">Analytical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audience
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value as any)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="executive">Executive</option>
                      <option value="technical">Technical</option>
                      <option value="procurement">Procurement</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    data-demo="ai-generate-button"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    {generating ? 'Generating...' : 'Generate Summary'}
                  </button>
                  
                  {selectedSummary && (
                    <>
                      <button
                        onClick={handleSaveFinal}
                        disabled={selectedSummary.isOfficial}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        {selectedSummary.isOfficial ? 'Official' : 'Mark as Official'}
                      </button>
                      
                      <button
                        onClick={handleClone}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                        Clone
                      </button>
                      
                      {/* Export Buttons */}
                      <button
                        onClick={handleExportPDF}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        data-demo="export-actions"
                        title="Export as PDF"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Export PDF
                      </button>
                      
                      <button
                        onClick={handleExportDocx}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        title="Export as Word"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Export Word
                      </button>
                      
                      <button
                        onClick={handleDelete}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <TrashIcon className="h-5 w-5 mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {lastSaved && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Last saved: {lastSaved.toLocaleTimeString()}
                    {autoSaving && ' (saving...)'}
                  </div>
                )}
              </div>

              {/* Title Input */}
              {selectedSummary && (
                <div className="p-4 border-b border-gray-200">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xl font-semibold border-none focus:ring-0 focus:outline-none"
                    placeholder="Summary Title"
                  />
                </div>
              )}

              {/* Rich Text Editor */}
              <div className="p-4">
                {selectedSummary ? (
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    className="min-h-[500px]"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean'],
                      ],
                    }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No summary selected</p>
                    <p className="text-sm">
                      Generate a new summary or select an existing version from the sidebar
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && comparisonVersionA && comparisonVersionB && (
        <ComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          rfpId={rfpId}
          summaryAId={comparisonVersionA}
          summaryBId={comparisonVersionB}
          versionA={summaries.find(s => s.id === comparisonVersionA)?.version || 0}
          versionB={summaries.find(s => s.id === comparisonVersionB)?.version || 0}
        />
      )}
    </div>
  );
}
