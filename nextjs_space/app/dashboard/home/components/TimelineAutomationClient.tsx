/**
 * STEP 55: Timeline Automation Client Component
 * Provides the UI box and button to run timeline automation
 */

'use client';

import React, { useState } from 'react';
import {
  ArrowPathIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import TimelineAutomationModal from './TimelineAutomationModal';
import type { TimelineAutomationResult } from '@/lib/timeline/timeline-automation-engine';

export default function TimelineAutomationClient() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TimelineAutomationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRunAutomation = async () => {
    try {
      setIsRunning(true);
      setError(null);

      const res = await fetch('/api/dashboard/timeline/automation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to run timeline automation');
      }

      const { data } = await res.json();
      setResult(data);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Error running timeline automation:', err);
      setError(err.message || 'Failed to run timeline automation');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-3 shadow-md">
                    <SparklesIcon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Timeline Automation Engine
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Automatic stage advancement & smart reminders
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <ArrowPathIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Auto-Advance Phases:</span> Automatically
                    move RFPs to the next stage based on timeline dates (7 transition rules)
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <ClockIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Smart Reminders:</span> Generate buyer
                    reminders (9 types) and supplier reminders (6 types) for deadlines and
                    action items
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleRunAutomation}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running Automation...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Run Timeline Automation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-3 border-t border-indigo-200">
          <p className="text-xs text-indigo-700 font-medium">
            ✨ Safe to run multiple times • Idempotent operations • Activity logged
          </p>
        </div>
      </div>

      {/* Results Modal */}
      <TimelineAutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={result}
      />
    </>
  );
}
