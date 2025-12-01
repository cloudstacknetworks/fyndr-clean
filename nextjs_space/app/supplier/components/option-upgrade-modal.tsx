"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export default function OptionUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-600"
        title="Learn about additional features"
        data-demo-trigger="show-upgrade-modal"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" data-demo-element="upgrade-modal">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Additional Features Available</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Additional Supplier Portal enhancements are available in Option 3 (not enabled in this prototype).
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Predictive behavior analysis</li>
                <li>• AI-powered scoring insights</li>
                <li>• Automated feedback on responses</li>
                <li>• Real-time collaboration tools</li>
                <li>• Advanced analytics dashboard</li>
              </ul>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                data-demo-action="close-modal"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
