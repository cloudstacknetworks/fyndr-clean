/**
 * Buyer Notification Preferences Page
 * STEP 22: Notifications & Reminders Engine
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  buyerRfpTimeline: boolean;
  buyerSupplierResponses: boolean;
  buyerSupplierQuestions: boolean;
  buyerQABroadcasts: boolean;
  buyerReadinessChanges: boolean;
}

export default function BuyerNotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving preferences.' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className=\"max-w-3xl mx-auto py-8 px-4\">
        <div className=\"flex items-center justify-center py-12\">
          <Loader2 className=\"h-8 w-8 animate-spin text-indigo-600\" />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className=\"max-w-3xl mx-auto py-8 px-4\">
        <div className=\"bg-red-50 border border-red-200 rounded-lg p-4 text-center\">
          <AlertCircle className=\"h-8 w-8 text-red-600 mx-auto mb-2\" />
          <p className=\"text-red-800\">Failed to load notification preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"max-w-3xl mx-auto py-8 px-4\">
      {/* Header */}
      <div className=\"mb-6\">
        <h1 className=\"text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent\">
          Notification Preferences
        </h1>
        <p className=\"text-gray-600 mt-2\">
          Customize how you receive notifications for your RFP activities.
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className=\"h-5 w-5 flex-shrink-0\" />
          ) : (
            <AlertCircle className=\"h-5 w-5 flex-shrink-0\" />
          )}
          <p className=\"text-sm font-medium\">{message.text}</p>
        </div>
      )}

      {/* Preferences Form */}
      <div className=\"bg-white rounded-lg shadow-sm border border-gray-200\">
        {/* Global Toggles */}
        <div className=\"p-6 border-b border-gray-200\">
          <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">Global Settings</h2>
          <div className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"emailEnabled\" className=\"text-sm font-medium text-gray-900\">
                  Email Notifications
                </label>
                <p className=\"text-sm text-gray-600\">
                  Receive notifications via email
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"emailEnabled\"
                  type=\"checkbox\"
                  checked={preferences.emailEnabled}
                  onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>

            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"inAppEnabled\" className=\"text-sm font-medium text-gray-900\">
                  In-App Notifications
                </label>
                <p className=\"text-sm text-gray-600\">
                  Show notifications in the notification center
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"inAppEnabled\"
                  type=\"checkbox\"
                  checked={preferences.inAppEnabled}
                  onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Buyer-Specific Toggles */}
        <div className=\"p-6\">
          <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">Notification Categories</h2>
          <div className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"buyerRfpTimeline\" className=\"text-sm font-medium text-gray-900\">
                  Timeline Reminders
                </label>
                <p className=\"text-sm text-gray-600\">
                  Deadlines, milestones, and important dates
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"buyerRfpTimeline\"
                  type=\"checkbox\"
                  checked={preferences.buyerRfpTimeline}
                  onChange={(e) => updatePreference('buyerRfpTimeline', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>

            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"buyerSupplierResponses\" className=\"text-sm font-medium text-gray-900\">
                  Supplier Responses
                </label>
                <p className=\"text-sm text-gray-600\">
                  When suppliers submit or update their responses
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"buyerSupplierResponses\"
                  type=\"checkbox\"
                  checked={preferences.buyerSupplierResponses}
                  onChange={(e) => updatePreference('buyerSupplierResponses', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>

            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"buyerSupplierQuestions\" className=\"text-sm font-medium text-gray-900\">
                  Supplier Questions
                </label>
                <p className=\"text-sm text-gray-600\">
                  When suppliers submit new questions
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"buyerSupplierQuestions\"
                  type=\"checkbox\"
                  checked={preferences.buyerSupplierQuestions}
                  onChange={(e) => updatePreference('buyerSupplierQuestions', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>

            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"buyerQABroadcasts\" className=\"text-sm font-medium text-gray-900\">
                  Broadcast Announcements
                </label>
                <p className=\"text-sm text-gray-600\">
                  When you send broadcast messages to suppliers
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"buyerQABroadcasts\"
                  type=\"checkbox\"
                  checked={preferences.buyerQABroadcasts}
                  onChange={(e) => updatePreference('buyerQABroadcasts', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>

            <div className=\"flex items-center justify-between\">
              <div className=\"flex-1\">
                <label htmlFor=\"buyerReadinessChanges\" className=\"text-sm font-medium text-gray-900\">
                  Readiness & Comparison Updates
                </label>
                <p className=\"text-sm text-gray-600\">
                  When readiness scores and comparison reports are ready
                </p>
              </div>
              <label className=\"relative inline-flex items-center cursor-pointer\">
                <input
                  id=\"buyerReadinessChanges\"
                  type=\"checkbox\"
                  checked={preferences.buyerReadinessChanges}
                  onChange={(e) => updatePreference('buyerReadinessChanges', e.target.checked)}
                  className=\"sr-only peer\"
                />
                <div className=\"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600\"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className=\"p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between\">
          <p className=\"text-sm text-gray-600\">
            Changes will take effect immediately
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className=\"inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium\"
          >
            {saving ? (
              <>
                <Loader2 className=\"h-5 w-5 animate-spin\" />
                Saving...
              </>
            ) : (
              <>
                <Save className=\"h-5 w-5\" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
