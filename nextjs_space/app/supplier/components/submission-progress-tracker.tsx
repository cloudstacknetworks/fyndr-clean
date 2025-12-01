"use client";

import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ProgressTrackerProps {
  structuredData?: any;
  attachments?: any[];
  submittedAt?: Date | null;
}

export default function SubmissionProgressTracker({ structuredData, attachments, submittedAt }: ProgressTrackerProps) {
  const checklist = [
    {
      label: "Executive Summary",
      completed: !!structuredData?.executiveSummary,
      required: true
    },
    {
      label: "Requirements Coverage",
      completed: !!structuredData?.requirementsCoverage,
      required: true
    },
    {
      label: "Pricing Sheets",
      completed: !!structuredData?.pricing,
      required: true
    },
    {
      label: "Attachments",
      completed: attachments && attachments.length > 0,
      required: true
    },
    {
      label: "Demo Links",
      completed: !!structuredData?.demoLinks,
      required: false
    },
    {
      label: "References",
      completed: !!structuredData?.references,
      required: false
    },
    {
      label: "Final Review",
      completed: !!submittedAt,
      required: true
    }
  ];

  const completedCount = checklist.filter(item => item.completed).length;
  const requiredCount = checklist.filter(item => item.required).length;
  const completedRequired = checklist.filter(item => item.required && item.completed).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow p-6" data-demo-element="progress-tracker">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Submission Progress</h3>
        <div className="text-2xl font-bold text-indigo-600">{percentage}%</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {checklist.map((item, index) => (
          <div key={index} className="flex items-center gap-3" data-demo-field={`checklist-item-${index}`}>
            {item.completed ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : item.required ? (
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
            <span className={item.completed ? "text-gray-900" : "text-gray-500"}>
              {item.label}
              {item.required && !item.completed && (
                <span className="text-red-600 ml-1">*</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Warning */}
      {completedRequired < requiredCount && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            {requiredCount - completedRequired} required section{requiredCount - completedRequired !== 1 ? "s" : ""} remaining
          </p>
        </div>
      )}
    </div>
  );
}
