/**
 * STEP 55: Timeline Automation Results Modal
 * Displays the results of timeline automation execution
 */

'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { TimelineAutomationResult } from '@/lib/timeline/timeline-automation-engine';

interface TimelineAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TimelineAutomationResult | null;
}

export default function TimelineAutomationModal({
  isOpen,
  onClose,
  result,
}: TimelineAutomationModalProps) {
  if (!result) return null;

  const {
    autoAdvancedRfps,
    buyerReminders,
    supplierReminders,
    errors,
    metadata,
  } = result;

  const totalChanges =
    autoAdvancedRfps.length + buyerReminders.length + supplierReminders.length;

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowPathIcon className="h-7 w-7" />
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-bold">
                          Timeline Automation Results
                        </Dialog.Title>
                        <p className="text-sm text-indigo-100 mt-1">
                          Executed at {new Date(metadata.executedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-2 hover:bg-white/20 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                        <ArrowPathIcon className="h-5 w-5" />
                        Auto-Advanced
                      </div>
                      <div className="text-3xl font-bold text-blue-900">
                        {autoAdvancedRfps.length}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">RFPs advanced to next stage</div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                        <BellIcon className="h-5 w-5" />
                        Buyer Reminders
                      </div>
                      <div className="text-3xl font-bold text-amber-900">
                        {buyerReminders.length}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">Action items identified</div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                        <BellIcon className="h-5 w-5" />
                        Supplier Reminders
                      </div>
                      <div className="text-3xl font-bold text-emerald-900">
                        {supplierReminders.length}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">Supplier notifications</div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">RFPs Processed:</span>{' '}
                        <span className="font-semibold text-gray-900">
                          {metadata.totalRfpsProcessed}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Execution Time:</span>{' '}
                        <span className="font-semibold text-gray-900">
                          {metadata.executionTimeMs}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        Errors & Warnings ({errors.length})
                      </div>
                      <div className="space-y-2">
                        {errors.map((error, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-red-800 bg-white rounded p-2 border border-red-100"
                          >
                            <div className="font-medium">{error.error}</div>
                            <div className="text-red-600">{error.message}</div>
                            {error.rfpTitle && (
                              <div className="text-red-500 text-xs mt-1">RFP: {error.rfpTitle}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-Advanced RFPs */}
                  {autoAdvancedRfps.length > 0 && (
                    <div className="border border-blue-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold">
                          <ArrowPathIcon className="h-5 w-5" />
                          Auto-Advanced RFPs ({autoAdvancedRfps.length})
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {autoAdvancedRfps.map((adv, idx) => (
                          <div key={idx} className="p-4 bg-white hover:bg-gray-50">
                            <div className="font-medium text-gray-900">{adv.rfpTitle}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {adv.fromStage} → {adv.toStage}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{adv.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buyer Reminders */}
                  {buyerReminders.length > 0 && (
                    <div className="border border-amber-200 rounded-lg overflow-hidden">
                      <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                        <div className="flex items-center gap-2 text-amber-700 font-semibold">
                          <BellIcon className="h-5 w-5" />
                          Buyer Reminders ({buyerReminders.length})
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {buyerReminders.map((rem, idx) => (
                          <div key={idx} className="p-4 bg-white hover:bg-gray-50">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  rem.urgency === 'CRITICAL'
                                    ? 'bg-red-100 text-red-800'
                                    : rem.urgency === 'HIGH'
                                    ? 'bg-orange-100 text-orange-800'
                                    : rem.urgency === 'MEDIUM'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {rem.urgency}
                              </span>
                              <span className="text-xs text-gray-500">{rem.reminderType}</span>
                            </div>
                            <div className="font-medium text-gray-900">{rem.rfpTitle}</div>
                            <div className="text-sm text-gray-600 mt-1">{rem.message}</div>
                            {rem.dueDate && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                Due: {new Date(rem.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supplier Reminders */}
                  {supplierReminders.length > 0 && (
                    <div className="border border-emerald-200 rounded-lg overflow-hidden">
                      <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                          <BellIcon className="h-5 w-5" />
                          Supplier Reminders ({supplierReminders.length})
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {supplierReminders.slice(0, 10).map((rem, idx) => (
                          <div key={idx} className="p-4 bg-white hover:bg-gray-50">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  rem.urgency === 'CRITICAL'
                                    ? 'bg-red-100 text-red-800'
                                    : rem.urgency === 'HIGH'
                                    ? 'bg-orange-100 text-orange-800'
                                    : rem.urgency === 'MEDIUM'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {rem.urgency}
                              </span>
                              <span className="text-xs text-gray-500">{rem.reminderType}</span>
                            </div>
                            <div className="font-medium text-gray-900">{rem.supplierName}</div>
                            <div className="text-sm text-gray-600 mt-1">{rem.message}</div>
                            <div className="text-xs text-gray-500 mt-1">RFP: {rem.rfpTitle}</div>
                          </div>
                        ))}
                        {supplierReminders.length > 10 && (
                          <div className="p-3 bg-emerald-50 text-center text-sm text-emerald-700">
                            ... and {supplierReminders.length - 10} more supplier reminders
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Changes */}
                  {totalChanges === 0 && errors.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-3" />
                      <div className="text-lg font-semibold text-gray-900">All Caught Up!</div>
                      <div className="text-sm text-gray-600 mt-2">
                        No RFPs to advance or reminders to generate at this time.
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
