'use client';

import { AlertTriangle, X } from 'lucide-react';

interface StageTransitionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warning: string | null;
  incompleteTasks: string[];
}

export default function StageTransitionWarningModal({
  isOpen,
  onClose,
  onConfirm,
  warning,
  incompleteTasks
}: StageTransitionWarningModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Stage Transition Warning
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Warning Message */}
            {warning && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="text-sm text-amber-800">{warning}</p>
              </div>
            )}

            {/* Incomplete Tasks List */}
            {incompleteTasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Incomplete Tasks:
                </h4>
                <ul className="space-y-2">
                  {incompleteTasks.map((task, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm text-gray-700"
                    >
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Info */}
            <p className="text-sm text-gray-600">
              Are you sure you want to proceed with this stage transition?
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
