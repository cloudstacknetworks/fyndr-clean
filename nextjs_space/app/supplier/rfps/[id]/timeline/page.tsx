/**
 * Supplier Timeline View (STEP 36)
 * 
 * Read-only timeline view for suppliers with 4 sections:
 * 1. Header with Current Phase Badge
 * 2. Phase Progress Bar (read-only visual)
 * 3. Upcoming Events List (filtered, no internal notes)
 * 4. Scope Boundary Note
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";

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

export default function SupplierTimelinePage() {
  const params = useParams();
  const rfpId = params.id as string;

  const [rfpTitle, setRfpTitle] = useState<string>("Loading...");
  const [state, setState] = useState<TimelineState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline data
  useEffect(() => {
    fetchTimelineData();
    fetchRfpTitle();
  }, [rfpId]);

  const fetchRfpTitle = async () => {
    try {
      const res = await fetch(`/api/supplier/rfps/${rfpId}`);
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
      // Note: In a real implementation, this would use a supplier-specific endpoint
      // that filters sensitive information. For demo purposes, we'll use the same
      // endpoint but ensure suppliers can only see their assigned RFPs through
      // API-level permission checks.
      const res = await fetch(`/api/supplier/rfps/${rfpId}/timeline`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch timeline data");
      }
      
      const data = await res.json();
      setState(data.state);
    } catch (error: any) {
      setError(error.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: any) => {
    if (phase.isCompleted) return "bg-green-100 text-green-700 border-green-300";
    if (phase.isCurrent) return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-gray-100 text-gray-500 border-gray-300";
  };

  const getCurrentPhaseLabel = () => {
    if (!state || !state.currentPhase) return "Not Started";
    const phase = state.phases.find((p) => p.phaseId === state.currentPhase);
    return phase ? phase.label : "Unknown Phase";
  };

  // Filter events that are relevant to suppliers
  const getSupplierRelevantEvents = () => {
    if (!state) return [];
    
    // Filter out internal events, show only supplier-facing milestones
    const supplierFacingActions = [
      "open_q_and_a",
      "close_q_and_a",
      "lock_submissions",
      "send_submission_reminder",
      "open_demo_window",
      "close_demo_window",
      "send_demo_reminder",
    ];
    
    return state.nextEvents.filter((event) =>
      supplierFacingActions.includes(event.actionId)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || "Failed to load timeline"}</p>
        </div>
      </div>
    );
  }

  const supplierEvents = getSupplierRelevantEvents();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Section 1: Header with Current Phase Badge */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link
              href={`/supplier/rfps/${rfpId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RFP Timeline</h1>
              <p className="text-sm text-gray-600">{rfpTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Current Phase:</span>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
              {getCurrentPhaseLabel()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {state.isQaOpen ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700">Q&A Window</span>
            </div>
            <p className="text-xs text-gray-600">
              {state.isQaOpen ? "Open for questions" : "Closed"}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {state.isSubmissionsLocked ? (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className="text-sm font-medium text-gray-700">Submissions</span>
            </div>
            <p className="text-xs text-gray-600">
              {state.isSubmissionsLocked ? "Locked" : "Open"}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {state.isDemoWindowOpen ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700">Demo Window</span>
            </div>
            <p className="text-xs text-gray-600">
              {state.isDemoWindowOpen ? "Active" : "Not active"}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Phase Progress Bar (read-only visual) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          RFP Progress
        </h2>
        
        <div className="space-y-3">
          {state.phases
            .filter((p) => p.phaseId !== "planning") // Hide planning phase from suppliers
            .map((phase, index) => (
              <div key={phase.phaseId} className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    phase.isCompleted
                      ? "bg-green-100 border-green-500"
                      : phase.isCurrent
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {phase.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : phase.isCurrent ? (
                    <Clock className="w-5 h-5 text-blue-600" />
                  ) : (
                    <span className="text-sm text-gray-500">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      phase.isCurrent ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {phase.label}
                  </p>
                  {phase.startsAt && (
                    <p className="text-xs text-gray-500">
                      Starts: {new Date(phase.startsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {phase.isCurrent && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Current
                  </span>
                )}
                {phase.isCompleted && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Complete
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Section 3: Upcoming Events List (filtered, no internal notes) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming Milestones
        </h2>

        {supplierEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming milestones at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {supplierEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <Clock className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Date:</strong>{" "}
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Scope Boundary Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Timeline Information
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              This timeline shows key milestones for the RFP process up to the award
              decision. All dates are managed by the buyer and are subject to change.
              You will be notified of any updates that affect your submission requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
