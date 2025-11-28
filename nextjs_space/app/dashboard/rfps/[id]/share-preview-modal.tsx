'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  emailHtml: string;
  rfpTitle: string;
  templateName: string;
}

export default function SharePreviewModal({
  isOpen,
  onClose,
  onContinue,
  emailHtml,
  rfpTitle,
  templateName
}: SharePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Email Preview</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {rfpTitle} • {templateName} Template
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'preview'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email View
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'html'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              HTML Source
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {activeTab === 'preview' && (
              <div 
                className="bg-white rounded-lg shadow-sm"
                dangerouslySetInnerHTML={{ __html: emailHtml }}
              />
            )}
            
            {activeTab === 'html' && (
              <textarea
                readOnly
                value={emailHtml}
                className="w-full h-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onContinue}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              Continue to Share
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}
