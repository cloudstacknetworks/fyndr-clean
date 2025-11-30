/**
 * STEP 21: Buyer Supplier Questions Panel
 * Allows buyers to view, filter, and answer supplier questions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Loader2, 
  CheckCircle, 
  Clock,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { getQuestionWindowStatus, getQuestionWindowMessage, getQuestionWindowStyles } from '@/lib/qa-timeline';

interface SupplierContact {
  id: string;
  name: string;
  email: string;
  organization: string | null;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  askedAt: string;
  answeredAt: string | null;
  supplierContact: SupplierContact;
}

interface SupplierQuestionsPanelProps {
  rfpId: string;
  rfpTimeline: {
    askQuestionsStart: string | null;
    askQuestionsEnd: string | null;
  };
}

type FilterTab = 'all' | 'pending' | 'answered';

export default function SupplierQuestionsPanel({ rfpId, rfpTimeline }: SupplierQuestionsPanelProps) {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  
  // Answer modal state
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [broadcast, setBroadcast] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchQuestions();
  }, [rfpId]);
  
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/questions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnswerClick = (question: Question) => {
    setSelectedQuestion(question);
    setAnswer(question.answer || '');
    setBroadcast(true);
    setShowAnswerModal(true);
  };
  
  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          answer: answer.trim(),
          broadcast
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }
      
      // Close modal and refresh questions
      setShowAnswerModal(false);
      setSelectedQuestion(null);
      setAnswer('');
      fetchQuestions();
      router.refresh();
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (activeFilter === 'pending') return q.status === 'PENDING';
    if (activeFilter === 'answered') return q.status === 'ANSWERED';
    return true;
  });
  
  // Get window status and styling
  const timelineForCheck = {
    askQuestionsStart: rfpTimeline.askQuestionsStart ? new Date(rfpTimeline.askQuestionsStart) : null,
    askQuestionsEnd: rfpTimeline.askQuestionsEnd ? new Date(rfpTimeline.askQuestionsEnd) : null,
  };
  const windowStatus = getQuestionWindowStatus(timelineForCheck);
  const windowMessage = getQuestionWindowMessage(timelineForCheck);
  const windowStyles = getQuestionWindowStyles(windowStatus);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Supplier Questions & Answers
          </h2>
        </div>
      </div>
      
      {/* Window Status Indicator */}
      <div className={`mb-4 p-3 rounded-lg border ${windowStyles.borderClass} ${windowStyles.badgeClass}`}>
        <p className="text-sm font-medium">
          {windowMessage}
        </p>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({questions.length})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'pending'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending ({questions.filter(q => q.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveFilter('answered')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'answered'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Answered ({questions.filter(q => q.status === 'ANSWERED').length})
        </button>
      </div>
      
      {/* Questions Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {activeFilter === 'all' && 'No questions submitted yet.'}
            {activeFilter === 'pending' && 'No pending questions.'}
            {activeFilter === 'answered' && 'No answered questions yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asked At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestions.map((q) => (
                <tr
                  key={q.id}
                  className={`${
                    q.status === 'PENDING' 
                      ? 'bg-amber-50 border-l-4 border-amber-300' 
                      : 'bg-green-50 border-l-4 border-green-300'
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {q.supplierContact.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {q.supplierContact.email}
                      </div>
                      {q.supplierContact.organization && (
                        <div className="text-xs text-gray-400">
                          {q.supplierContact.organization}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-md">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {q.question}
                    </p>
                    {q.answer && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700">Answer:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{q.answer}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      q.status === 'PENDING'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {q.status === 'PENDING' ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Answered
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(q.askedAt)}
                    {q.answeredAt && (
                      <div className="text-xs text-green-600">
                        Answered: {formatDate(q.answeredAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleAnswerClick(q)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      {q.status === 'PENDING' ? 'Answer' : 'View/Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Answer Modal */}
      {showAnswerModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedQuestion.status === 'PENDING' ? 'Answer Question' : 'Edit Answer'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    From: {selectedQuestion.supplierContact.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowAnswerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Question */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-1">Question:</p>
                <p className="text-gray-900">{selectedQuestion.question}</p>
              </div>
              
              {/* Answer Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={6}
                  placeholder="Enter your answer..."
                />
              </div>
              
              {/* Broadcast Toggle */}
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcast}
                    onChange={(e) => setBroadcast(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      Broadcast this answer to ALL suppliers
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      When enabled, this answer will be visible to all invited suppliers as a general announcement. 
                      The original question will remain private to the asking supplier.
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAnswerModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !answer.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
