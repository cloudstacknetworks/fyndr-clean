/**
 * STEP 53: Preferences & Defaults Component
 * User-specific preferences and default values for RFP creation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Preferences {
  defaultRfpPriority: string;
  defaultRfpStage: string;
  autoAssignSuppliers: boolean;
  enableAutoNotifications: boolean;
  defaultTimezone: string;
  requireApprovalForAward: boolean;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
];

export default function PreferencesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [defaultRfpPriority, setDefaultRfpPriority] = useState('MEDIUM');
  const [defaultRfpStage, setDefaultRfpStage] = useState('INTAKE');
  const [autoAssignSuppliers, setAutoAssignSuppliers] = useState(false);
  const [enableAutoNotifications, setEnableAutoNotifications] = useState(true);
  const [defaultTimezone, setDefaultTimezone] = useState('America/New_York');
  const [requireApprovalForAward, setRequireApprovalForAward] = useState(true);

  // ========================================
  // Fetch Preferences
  // ========================================
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/settings/preferences');
      const data = await response.json();

      if (data.success && data.preferences) {
        const prefs = data.preferences;
        setDefaultRfpPriority(prefs.defaultRfpPriority || 'MEDIUM');
        setDefaultRfpStage(prefs.defaultRfpStage || 'INTAKE');
        setAutoAssignSuppliers(prefs.autoAssignSuppliers || false);
        setEnableAutoNotifications(prefs.enableAutoNotifications !== false); // Default true
        setDefaultTimezone(prefs.defaultTimezone || 'America/New_York');
        setRequireApprovalForAward(prefs.requireApprovalForAward !== false); // Default true
      } else {
        toast.error(data.error || 'Failed to load preferences.');
      }
    } catch (error) {
      console.error('[PreferencesSettings] Fetch error:', error);
      toast.error('Failed to load preferences.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Save Preferences
  // ========================================
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/dashboard/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultRfpPriority,
          defaultRfpStage,
          autoAssignSuppliers,
          enableAutoNotifications,
          defaultTimezone,
          requireApprovalForAward,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Preferences updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update preferences.');
      }
    } catch (error) {
      console.error('[PreferencesSettings] Save error:', error);
      toast.error('Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Loading State
  // ========================================
  if (loading) {
    return (
      <div data-demo="settings-preferences" className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ========================================
  // Render
  // ========================================
  return (
    <div data-demo="settings-preferences" className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences & Defaults</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set your default values and preferences for RFP creation and management.
        </p>
      </div>

      <div className="space-y-6">
        {/* RFP Creation Defaults */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">RFP Creation Defaults</h4>
          
          <div className="space-y-4">
            {/* Default Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default RFP Priority
              </label>
              <select
                value={defaultRfpPriority}
                onChange={(e) => setDefaultRfpPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Automatically applied to new RFPs.
              </p>
            </div>

            {/* Default Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default RFP Stage
              </label>
              <select
                value={defaultRfpStage}
                onChange={(e) => setDefaultRfpStage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INTAKE">Intake</option>
                <option value="QUALIFICATION">Qualification</option>
                <option value="DISCOVERY">Discovery</option>
                <option value="DRAFTING">Drafting</option>
                <option value="PRICING_LEGAL_REVIEW">Pricing & Legal Review</option>
                <option value="EXEC_REVIEW">Executive Review</option>
                <option value="SUBMISSION">Submission</option>
                <option value="DEBRIEF">Debrief</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Starting stage for new RFPs.
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Preferences */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Workflow Preferences</h4>
          
          <div className="space-y-4">
            {/* Auto-Assign Suppliers */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={autoAssignSuppliers}
                  onChange={(e) => setAutoAssignSuppliers(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label className="text-sm font-medium text-gray-700">
                  Auto-assign suppliers to new RFPs
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically invite pre-selected suppliers when creating new RFPs.
                </p>
              </div>
            </div>

            {/* Auto Notifications */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={enableAutoNotifications}
                  onChange={(e) => setEnableAutoNotifications(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label className="text-sm font-medium text-gray-700">
                  Enable automatic notifications
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Receive system notifications for RFP updates and supplier activities.
                </p>
              </div>
            </div>

            {/* Require Award Approval */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={requireApprovalForAward}
                  onChange={(e) => setRequireApprovalForAward(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label className="text-sm font-medium text-gray-700">
                  Require approval for award decisions
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Enable a review step before finalizing award decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Preferences */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Regional Preferences</h4>
          
          <div className="space-y-4">
            {/* Default Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Timezone
              </label>
              <select
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Used for displaying dates and times in your account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
