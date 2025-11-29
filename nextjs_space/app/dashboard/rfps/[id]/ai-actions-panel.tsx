'use client';

import { useState } from 'react';
import { StageAIAction } from '@/lib/stage-ai-actions';
import AIOutputModal from '@/app/components/ai-output-modal';
import { Loader2 } from 'lucide-react';

interface AIActionsPanelProps {
  rfpId: string;
  stage: string;
  actions: StageAIAction[];
}

export default function AIActionsPanel({ rfpId, stage, actions }: AIActionsPanelProps) {
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Hide panel if no actions for this stage
  if (actions.length === 0) {
    return null;
  }
  
  const handleActionClick = async (action: StageAIAction) => {
    setLoadingActionId(action.id);
    setError(null);
    
    try {
      const response = await fetch(`/api/rfps/${rfpId}/actions/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actionId: action.id })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate AI response');
      }
      
      const data = await response.json();
      
      setModalTitle(action.label);
      setModalContent(data.output);
      setModalOpen(true);
      
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingActionId(null);
    }
  };
  
  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          AI Actions for This Stage
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={loadingActionId !== null}
              title={action.description}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingActionId === action.id ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Generating...
                </>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      </div>
      
      <AIOutputModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        content={modalContent}
        rfpId={rfpId}
      />
    </>
  );
}
