/**
 * STEP 61: Buyer Evaluation Workspace - Scoring Table Component
 * 
 * Displays scoring items with auto-scores, overrides, variance, and actions
 */

'use client';

import { ScoringItem } from '@/lib/evaluation/evaluation-engine';
import { PencilIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface ScoringTableProps {
  scoringItems: ScoringItem[];
  onOpenOverrideModal: (item: ScoringItem) => void;
  onOpenCommentDrawer: (item: ScoringItem) => void;
}

export default function ScoringTable({
  scoringItems,
  onOpenOverrideModal,
  onOpenCommentDrawer,
}: ScoringTableProps) {
  const getVarianceColorClass = (varianceLevel: 'low' | 'medium' | 'high') => {
    switch (varianceLevel) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="overflow-x-auto" data-demo="scoring-table">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-left text-sm font-semibold">Requirement</th>
            <th className="p-3 text-left text-sm font-semibold">Supplier Response</th>
            <th className="p-3 text-center text-sm font-semibold">Auto Score</th>
            <th className="p-3 text-center text-sm font-semibold">Override Score</th>
            <th className="p-3 text-center text-sm font-semibold">Variance</th>
            <th className="p-3 text-center text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {scoringItems.map((item) => (
            <tr key={item.requirementId} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <div className="font-semibold text-sm">{item.requirementTitle}</div>
                {item.mustHave && (
                  <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                    Must-Have
                  </span>
                )}
                {item.mustHaveViolation && (
                  <span className="mt-1 ml-1 inline-block rounded bg-red-600 px-2 py-0.5 text-xs text-white">
                    ⚠ Violation
                  </span>
                )}
              </td>
              <td className="p-3">
                <div className="max-w-md text-sm text-gray-700">
                  {item.supplierResponseText ? (
                    truncateText(item.supplierResponseText)
                  ) : (
                    <span className="text-gray-400 italic">No response</span>
                  )}
                </div>
              </td>
              <td className="p-3 text-center">
                <span className="font-semibold text-gray-900">{item.autoScore.toFixed(0)}</span>
              </td>
              <td className="p-3 text-center">
                {item.overrideScore !== null ? (
                  <span className="font-semibold text-blue-600">{item.overrideScore.toFixed(0)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="p-3 text-center">
                {item.variance > 0 ? (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getVarianceColorClass(
                      item.varianceLevel
                    )}`}
                  >
                    {item.variance.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="p-3 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onOpenOverrideModal(item)}
                    className="text-blue-600 hover:text-blue-800 transition"
                    title="Override Score"
                    data-demo="override-button"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onOpenCommentDrawer(item)}
                    className="text-gray-600 hover:text-gray-800 transition relative"
                    title="View/Add Comments"
                    data-demo="comment-button"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    {item.comments.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {item.comments.length}
                      </span>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
