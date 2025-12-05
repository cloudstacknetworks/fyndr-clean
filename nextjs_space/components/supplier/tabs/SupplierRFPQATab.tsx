'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Tab Component: Q&A
 */

import { useEffect, useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';

interface Question {
  id: string;
  question: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  askedAt: string;
  answeredAt: string | null;
}

interface BroadcastMessage {
  id: string;
  message: string;
  createdAt: string;
}

interface SupplierRFPQATabProps {
  rfpId: string;
}

export default function SupplierRFPQATab({ rfpId }: SupplierRFPQATabProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');

  useEffect(() => {
    async function fetchQAData() {
      try {
        setLoading(true);
        
        // Fetch questions (assuming existing endpoint exists or reusing existing logic)
        // For now, we'll use a placeholder - this would integrate with existing Q&A endpoints
        const questionsResponse = await fetch(`/api/dashboard/supplier/rfps/${rfpId}/questions`);
        const broadcastsResponse = await fetch(`/api/dashboard/supplier/rfps/${rfpId}/broadcasts`);

        if (questionsResponse.ok) {
          const qResult = await questionsResponse.json();
          setQuestions(qResult.data || []);
        }

        if (broadcastsResponse.ok) {
          const bResult = await broadcastsResponse.json();
          setBroadcasts(bResult.data || []);
        }
      } catch (err) {
        console.error('Error fetching Q&A data:', err);
        setError('Failed to load Q&A data');
      } finally {
        setLoading(false);
      }
    }

    fetchQAData();
  }, [rfpId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'answered') return q.status === 'ANSWERED';
    if (filter === 'unanswered') return q.status === 'PENDING';
    return true;
  });

  const answeredCount = questions.filter((q) => q.status === 'ANSWERED').length;
  const unansweredCount = questions.filter((q) => q.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Broadcast Messages */}
      {broadcasts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MegaphoneIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Broadcast Messages
          </h3>
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                  {broadcast.message}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(broadcast.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Your Questions ({questions.length})
          </h3>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === 'answered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Answered ({answeredCount})
            </button>
            <button
              onClick={() => setFilter('unanswered')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === 'unanswered'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Pending ({unansweredCount})
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              You haven&apos;t asked any questions yet.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Use the Q&A system to ask questions about this RFP.
            </p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No questions match your filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`border rounded-lg p-4 ${
                  q.status === 'ANSWERED'
                    ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                {/* Question */}
                <div className="flex items-start gap-3 mb-3">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Question
                      </span>
                      {q.status === 'ANSWERED' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white">
                      {q.question}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Asked on {formatDate(q.askedAt)}
                    </p>
                  </div>
                </div>

                {/* Answer */}
                {q.status === 'ANSWERED' && q.answer && (
                  <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Answer
                      </div>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {q.answer}
                      </p>
                      {q.answeredAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Answered on {formatDate(q.answeredAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {q.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Awaiting response from buyer...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> To ask new questions, please use the Q&A system in the main submission area.
        </p>
      </div>
    </div>
  );
}
