/**
 * STEP 61: Buyer Evaluation Workspace - Comment Drawer Component
 * 
 * Drawer for viewing and adding evaluator comments
 */

'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ScoringItem, CommentItem } from '@/lib/evaluation/evaluation-engine';

interface CommentDrawerProps {
  isOpen: boolean;
  scoringItem: ScoringItem | null;
  onClose: () => void;
  onAddComment: (requirementId: string, commentText: string) => Promise<void>;
}

export default function CommentDrawer({
  isOpen,
  scoringItem,
  onClose,
  onAddComment,
}: CommentDrawerProps) {
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setNewComment('');
      setError('');
    }
  }, [isOpen]);

  const handleAddComment = async () => {
    if (!scoringItem || !newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onAddComment(scoringItem.requirementId, newComment.trim());
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen || !scoringItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-96 bg-white shadow-xl z-10 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Comments</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {scoringItem.requirementTitle}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {scoringItem.comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No comments yet
            </div>
          ) : (
            <div className="space-y-4">
              {scoringItem.comments.map((comment) => (
                <div key={comment.id} className="rounded border border-gray-200 p-3 bg-gray-50">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.userName}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{comment.commentText}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          {error && (
            <div className="mb-3 rounded bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            placeholder="Add a comment..."
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || loading}
            className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}
