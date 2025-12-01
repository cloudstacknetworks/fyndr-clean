/**
 * RFP Timeline & Automation Editor (STEP 36)
 * 
 * Buyer-only comprehensive timeline management with 7 sections:
 * 1. Header Bar
 * 2. Key Dates Editor
 * 3. Automation Rules
 * 4. Visual Timeline / Phase Bar
 * 5. Upcoming Events & Automation Preview
 * 6. Activity & Audit Banner
 * 7. Option 3 / Post-Award Out-of-Scope Note
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Play,
  Pause,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";

interface TimelineConfig {
  version: number;
  timezone: string;
  keyDates: {
    invitationSentAt?: string | null;
    qaOpenAt?: string | null;
    qaCloseAt?: string | null;
    submissionDeadlineAt?: string | null;
    evaluationStartAt?: string | null;
    demoWindowStartAt?: string | null;
    demoWindowEndAt?: string | null;
    awardTargetAt?: string | null;
  };
  automation: {
    enableQaWindowAutoToggle: boolean;
    enableSubmissionAutoLock: boolean;
    enableDemoAutoWindow: boolean;
    enableAwardTargetReminder: boolean;
    reminderRules: {
      submissionReminderDaysBefore?: number | null;
      demoReminderDaysBefore?: number | null;
    };
  };
}

interface TimelineState {
  rfpId: string;
  generatedAt: string;
  currentPhase?: string | null;
  phases: Array<{
    phaseId: string;
    label: string;
    startsAt?: string | null;
    endsAt?: string | null;
    isCurrent: boolean;
    isCompleted: boolean;
    isUpcoming: boolean;
  }>;
  nextEvents: Array<{
    timestamp: string;
    label: string;
    actionId: string;
    description: string;
  }>;
  isQaOpen: boolean;
  isSubmissionsLocked: boolean;
  isDemoWindowOpen: boolean;
  awardTargetStatus: string;
}

export default function TimelineEditorPage() {
  const router = useRouter();
  const params = useParams();
  const rfpId = params.id as string;

  const [rfpTitle, setRfpTitle] = useState<string>("Loading...");
  const [config, setConfig] = useState<TimelineConfig | null>(null);
  const [state, setState] = useState<TimelineState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchTimelineData();
    fetchRfpTitle();
  }, [rfpId]);

  const fetchRfpTitle = async () => {
    try {
      const res = await fetch(`/api/rfps/${rfpId}`);
      if (res.ok) {
        const data = await res.json();
        setRfpTitle(data.title || "RFP");
      }
    } catch (error) {
      console.error("Error fetching RFP title:", error);
    }
  };

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/timeline`);
      if (!res.ok) {
        throw new Error("Failed to fetch timeline data");
      }
      const data = await res.json();
      setConfig(data.config);
      setState(data.state);
    } catch (error: any) {
      showMessage("error", error.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/timeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error("Failed to save timeline configuration");
      }

      const data = await res.json();
      setConfig(data.config);
      setState(data.state);
      showMessage("success", "Timeline configuration saved successfully");
    } catch (error: any) {
      showMessage("error", error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleRunTimeline = async (dryRun: boolean = false) => {
    try {
      setRunning(true);
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/timeline/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });

      if (!res.ok) {
        throw new Error("Failed to run timeline");
      }

      const data = await res.json();
      setState(data.snapshot);
      showMessage(
        "success",
        dryRun
          ? `Preview: ${data.actionsApplied.length} actions would be applied`
          : `Timeline executed: ${data.actionsApplied.length} actions applied`
      );
    } catch (error: any) {
      showMessage("error", error.message || "Failed to run timeline");
    } finally {
      setRunning(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateKeyDate = (key: string, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      keyDates: {
        ...config.keyDates,
        [key]: value || null,
      },
    });
  };

  const updateAutomation = (key: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      automation: {
        ...config.automation,
        [key]: value,
      },
    });
  };

  const updateReminderRule = (key: string, value: number | null) => {
    if (!config) return;
    setConfig({
      ...config,
      automation: {
        ...config.automation,
        reminderRules: {
          ...config.automation.reminderRules,
          [key]: value,
        },
      },
    });
  };

  const getPhaseColor = (phase: any) => {
    if (phase.isCompleted) return "bg-green-100 text-green-700 border-green-300";
    if (phase.isCurrent) return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-gray-100 text-gray-500 border-gray-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!config || !state) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Failed to load timeline configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Section 1: Header Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/rfps/${rfpId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Timeline & Automation</h1>
              <p className="text-sm text-gray-600">{rfpTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleRunTimeline(true)}
              disabled={running}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              <span>Dry Run</span>
            </button>
            <button
              onClick={() => handleRunTimeline(false)}
              disabled={running}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Run Timeline Now</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={
                message.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {message.text}
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Key Dates Editor */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Key Dates</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries({
            invitationSentAt: "Invitation Sent",
            qaOpenAt: "Q&A Opens",
            qaCloseAt: "Q&A Closes",
            submissionDeadlineAt: "Submission Deadline",
            evaluationStartAt: "Evaluation Starts",
            demoWindowStartAt: "Demo Window Start",
            demoWindowEndAt: "Demo Window End",
            awardTargetAt: "Target Award Date",
          }).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="datetime-local"
                value={
                  config.keyDates[key as keyof typeof config.keyDates]
                    ? new Date(config.keyDates[key as keyof typeof config.keyDates]!).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => updateKeyDate(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Automation Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Automation Rules</h2>
        
        <div className="space-y-4">
          {[
            {
              key: "enableQaWindowAutoToggle",
              label: "Automatically open/close Q&A window",
              description: "System will automatically manage Q&A window based on dates",
            },
            {
              key: "enableSubmissionAutoLock",
              label: "Automatically lock submissions after deadline",
              description: "Prevent suppliers from editing after deadline",
            },
            {
              key: "enableDemoAutoWindow",
              label: "Automatically open/close demo window",
              description: "System will manage demo window availability",
            },
            {
              key: "enableAwardTargetReminder",
              label: "Highlight award target date on dashboard",
              description: "Show reminders for upcoming award decision",
            },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={config.automation[key as keyof typeof config.automation] as boolean}
                onChange={(e) => updateAutomation(key, e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submission reminder (days before deadline)
              </label>
              <input
                type="number"
                value={config.automation.reminderRules.submissionReminderDaysBefore || ""}
                onChange={(e) =>
                  updateReminderRule(
                    "submissionReminderDaysBefore",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="e.g., 3"
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demo reminder (days before window)
              </label>
              <input
                type="number"
                value={config.automation.reminderRules.demoReminderDaysBefore || ""}
                onChange={(e) =>
                  updateReminderRule(
                    "demoReminderDaysBefore",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="e.g., 2"
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Visual Timeline / Phase Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline Phases</h2>
        
        <div className="flex items-center justify-between space-x-2">
          {state.phases.map((phase, index) => (
            <div key={phase.phaseId} className="flex-1">
              <div
                className={`p-3 rounded-lg border-2 ${getPhaseColor(phase)} text-center`}
              >
                <p className="text-sm font-semibold">{phase.label}</p>
                {phase.isCurrent && (
                  <p className="text-xs mt-1 font-medium">Current</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Upcoming Events & Automation Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming Events
        </h2>

        {state.nextEvents.length === 0 ? (
          <p className="text-gray-500">No upcoming events scheduled</p>
        ) : (
          <div className="space-y-3">
            {state.nextEvents.slice(0, 5).map((event, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.label}</p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 6: Activity & Audit Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              <strong>Activity Tracking:</strong> All timeline changes and automation
              events are logged for audit purposes.{" "}
              <Link
                href={`/dashboard/rfps/${rfpId}/activity`}
                className="text-blue-700 underline hover:text-blue-800"
              >
                View Activity Log
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Section 7: Option 3 / Post-Award Out-of-Scope Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">
              Scope Boundary: Pre-Award Only
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Note:</strong> FYNDR currently supports sourcing up to RFP Award.
              Post-award procurement processes (POs, invoices, contract execution workflows,
              vendor onboarding, spend tracking) are <strong>OUT OF SCOPE</strong> for this
              version. They are documented as a potential Option 3 add-on for future
              versions and are <strong>NOT implemented</strong> here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
