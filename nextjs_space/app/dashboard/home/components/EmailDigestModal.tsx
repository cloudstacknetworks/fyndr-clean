/**
 * STEP 52: Email Digest Modal Component
 * 
 * A modal dialog that displays the generated email digest HTML preview.
 * Supports both weekly and monthly timeframes.
 */

'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, DocumentDuplicateIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface EmailDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  timeframe: 'week' | 'month';
  summary: {
    activeRfpsCount: number;
    dueSoonCount: number;
    newAwardsCount: number;
    newSubmissionsCount: number;
    attentionItemsCount: number;
  };
}

export default function EmailDigestModal({
  isOpen,
  onClose,
  htmlContent,
  timeframe,
  summary,
}: EmailDigestModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fyndr-digest-${timeframe}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timeframeLabel = timeframe === 'week' ? 'Weekly' : 'Monthly';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className="h-8 w-8 text-white" />
                      <div className="text-left">
                        <Dialog.Title as="h3" className="text-xl font-bold text-white">
                          {timeframeLabel} Email Digest
                        </Dialog.Title>
                        <p className="text-sm text-violet-100 mt-1">
                          Preview your personalized RFP activity summary
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full p-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{summary.activeRfpsCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Active RFPs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{summary.dueSoonCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Due Soon</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{summary.newAwardsCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">New Awards</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{summary.newSubmissionsCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Submissions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{summary.attentionItemsCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Needs Attention</div>
                    </div>
                  </div>
                </div>

                {/* HTML Preview */}
                <div className="max-h-[60vh] overflow-y-auto bg-gray-100 p-6">
                  <div className="bg-white rounded-lg shadow-sm">
                    <iframe
                      srcDoc={htmlContent}
                      className="w-full border-0 rounded-lg"
                      style={{ minHeight: '600px', height: 'auto' }}
                      title="Email Digest Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Note:</span> This is a preview. In production, this digest can be sent via email.
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCopyHTML}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                    >
                      {copied ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          Copy HTML
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadHTML}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Download HTML
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
