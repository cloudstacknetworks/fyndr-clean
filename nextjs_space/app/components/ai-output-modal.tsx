'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AIOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  rfpId: string;
}

export default function AIOutputModal({
  isOpen,
  onClose,
  title,
  content,
  rfpId
}: AIOutputModalProps) {
  const [editableContent, setEditableContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Update editable content when content prop changes
  useEffect(() => {
    setEditableContent(content);
  }, [content]);
  
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      // Show brief success feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleSaveToInternalNotes = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/rfps/${rfpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          internalNotes: editableContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
        // Reload page to show updated notes
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save to internal notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-4">
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full min-h-[400px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="AI-generated content will appear here..."
            />
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div>
              {saveSuccess && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Saved successfully!
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleSaveToInternalNotes}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save to Internal Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
