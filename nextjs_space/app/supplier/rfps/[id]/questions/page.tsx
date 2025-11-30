/**
 * STEP 21: Supplier Q&A Page
 * Allows suppliers to view and submit questions for an RFP
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { getQuestionWindowStatus, getQuestionWindowMessage, getQuestionWindowStyles } from '@/lib/qa-timeline';

interface Question {
  id: string;
  question: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  askedAt: string;
  answeredAt: string | null;
}

interface RFPTimeline {
  askQuestionsStart: string | null;
  askQuestionsEnd: string | null;
}

export default function SupplierQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rfpTimeline, setRfpTimeline] = useState<RFPTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const maxChars = 500;
  
  // Fetch questions and RFP timeline
  useEffect(() => {
    fetchQuestions();
    fetchRFPTimeline();
  }, [rfpId]);
  
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supplier/rfps/${rfpId}/questions`);
      
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
  
  const fetchRFPTimeline = async () => {
    try {
      // Fetch from the main RFP page to get timeline info
      const response = await fetch(`/api/supplier/rfps/${rfpId}/timeline`);
      
      if (response.ok) {
        const data = await response.json();
        setRfpTimeline(data);
      }
    } catch (err) {
      console.error('Error fetching RFP timeline:', err);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    if (question.length > maxChars) {
      setError(`Question cannot exceed ${maxChars} characters`);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/supplier/rfps/${rfpId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit question');
      }
      
      setSuccess('Question submitted successfully!');
      setQuestion('');
      
      // Refresh questions list
      fetchQuestions();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Determine window status and styling
  const windowStatus = rfpTimeline 
    ? getQuestionWindowStatus(rfpTimeline)
    : 'NOT_OPEN';
  const windowMessage = rfpTimeline 
    ? getQuestionWindowMessage(rfpTimeline)
    : 'Loading timeline information...';
  const windowStyles = getQuestionWindowStyles(windowStatus);
  const isWindowOpen = windowStatus === 'OPEN';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/supplier/rfps/${rfpId}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFP Details
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-indigo-600" />
            Questions & Answers
          </h1>
          <p className="mt-2 text-gray-600">
            Submit questions about this RFP and view answers from the buyer.
          </p>
        </div>
        
        {/* Question Window Status Banner */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${windowStyles.borderClass}`}>
          <div className="flex items-start gap-3">
            {windowStatus === 'OPEN' && <CheckCircle className={`h-5 w-5 mt-0.5 ${windowStyles.textClass}`} />}
            {windowStatus === 'NOT_OPEN' && <Clock className={`h-5 w-5 mt-0.5 ${windowStyles.textClass}`} />}
            {windowStatus === 'CLOSED' && <AlertCircle className={`h-5 w-5 mt-0.5 ${windowStyles.textClass}`} />}
            
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${windowStyles.badgeClass}`}>
                {windowStatus === 'OPEN' && 'Window Open'}
                {windowStatus === 'NOT_OPEN' && 'Not Open Yet'}
                {windowStatus === 'CLOSED' && 'Window Closed'}
              </span>
              <p className={`${windowStyles.textClass} font-medium`}>
                {windowMessage}
              </p>
            </div>
          </div>
        </div>
        
        {/* Question Submission Form */}
        {isWindowOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit a Question</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={4}
                  placeholder="Enter your question here..."
                  maxLength={maxChars}
                  disabled={submitting}
                />
                <div className="mt-2 flex justify-between items-center">
                  <span className={`text-sm ${question.length > maxChars * 0.9 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {question.length}/{maxChars} characters
                  </span>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 text-sm">{success}</span>
                </div>
              )}
              
              <button
                type="submit"
                disabled={submitting || !question.trim() || question.length > maxChars}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Question
                  </>
                )}
              </button>
            </form>
          </div>
        )}
        
        {!isWindowOpen && (
          <div className="bg-gray-100 rounded-lg p-6 mb-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700">
              {windowStatus === 'NOT_OPEN' 
                ? 'The questions window is not open yet. You will be able to submit questions once it opens.'
                : 'The questions window has closed. You can no longer submit new questions.'}
            </p>
          </div>
        )}
        
        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Questions</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No questions submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border-2 ${
                    q.status === 'PENDING' 
                      ? 'bg-amber-50 border-amber-300' 
                      : 'bg-green-50 border-green-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      q.status === 'PENDING' 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {q.status === 'PENDING' ? 'Pending' : 'Answered'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Asked {formatDate(q.askedAt)}
                    </span>
                  </div>
                  
                  {/* Question Text */}
                  <div className="mb-3">
                    <p className="font-medium text-gray-900">{q.question}</p>
                  </div>
                  
                  {/* Answer (if available) */}
                  {q.answer && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm font-semibold text-green-900 mb-1">Answer:</p>
                      <p className="text-gray-700">{q.answer}</p>
                      {q.answeredAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Answered {formatDate(q.answeredAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
