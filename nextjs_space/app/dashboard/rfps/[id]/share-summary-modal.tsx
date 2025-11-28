'use client';

import { useState } from 'react';
import { X, Mail, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { generateSummaryEmailHtml } from '@/lib/email-templates';

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfpId: string;
  rfpTitle: string;
  summary: {
    overview: string;
    goals: string;
    dates: string;
    budget: string;
    risks: string;
  };
  templateName: 'Concise' | 'Executive' | 'Detailed';
}

export default function ShareSummaryModal({
  isOpen,
  onClose,
  rfpId,
  rfpTitle,
  summary,
  templateName,
}: ShareSummaryModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Handle adding email
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    
    if (!trimmedEmail) {
      setEmailError('Please enter an email address');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setEmailError('This email has already been added');
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setEmailInput('');
    setEmailError('');
  };

  // Handle removing email
  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  // Handle Enter key in input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  // Handle sending email
  const handleSend = async () => {
    // Validate that we have recipients
    if (emails.length === 0) {
      setErrorMessage('Please add at least one recipient');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Generate HTML email content with template name
      const summaryHtml = generateSummaryEmailHtml(rfpTitle, summary, templateName);

      // Send request to API
      const response = await fetch(`/api/rfps/${rfpId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: emails,
          summaryHtml: summaryHtml,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send email');
      }

      // Show success message
      setSuccessMessage(`Successfully sent summary to ${emails.length} recipient(s)!`);
      
      // Clear emails list
      setEmails([]);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error sending email:', error);
      setErrorMessage(error.message || 'Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Share Executive Summary
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Email Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email Addresses
              </label>
              
              {/* Email Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError('');
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter email address"
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Email Error */}
              {emailError && (
                <p className="text-sm text-red-600 mb-2">{emailError}</p>
              )}

              {/* Email Chips/Tags */}
              {emails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {emails.map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:bg-indigo-200 rounded-full p-0.5 transition"
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Toggle */}
            <div className="mb-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showPreview ? '− Hide Preview' : '+ Show Preview'}
              </button>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Email Preview
                </h3>
                <div className="bg-white p-4 rounded border border-gray-200 text-sm space-y-4">
                  <div>
                    <strong className="text-gray-700">Subject:</strong>
                    <p className="text-gray-600 mt-1">Executive Summary: {rfpTitle}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-500 pl-3">
                      <strong className="text-purple-700">High-Level Overview</strong>
                      <p className="text-gray-600 mt-1 text-xs">{summary.overview}</p>
                    </div>
                    <div className="border-l-4 border-indigo-500 pl-3">
                      <strong className="text-indigo-700">Goals & Objectives</strong>
                      <p className="text-gray-600 mt-1 text-xs">{summary.goals}</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-3">
                      <strong className="text-blue-700">Important Dates</strong>
                      <p className="text-gray-600 mt-1 text-xs">{summary.dates}</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3">
                      <strong className="text-green-700">Budget & Resources</strong>
                      <p className="text-gray-600 mt-1 text-xs">{summary.budget}</p>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-3">
                      <strong className="text-amber-700">Risk Factors</strong>
                      <p className="text-gray-600 mt-1 text-xs">{summary.risks}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || emails.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Summary
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
