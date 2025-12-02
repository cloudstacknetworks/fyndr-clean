"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Filter,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { getOpportunityRating } from "@/lib/opportunity-scoring";

// Phase definitions
const LIFECYCLE_PHASES = [
  { id: "PLANNING", label: "Planning", color: "bg-gray-100 border-gray-300", textColor: "text-gray-700" },
  { id: "INVITATION", label: "Invitation", color: "bg-blue-100 border-blue-300", textColor: "text-blue-700" },
  { id: "Q_AND_A", label: "Q&A", color: "bg-purple-100 border-purple-300", textColor: "text-purple-700" },
  { id: "SUBMISSION", label: "Submission", color: "bg-indigo-100 border-indigo-300", textColor: "text-indigo-700" },
  { id: "EVALUATION", label: "Evaluation", color: "bg-yellow-100 border-yellow-300", textColor: "text-yellow-700" },
  { id: "DEMO", label: "Demo", color: "bg-green-100 border-green-300", textColor: "text-green-700" },
  { id: "AWARD", label: "Award", color: "bg-emerald-100 border-emerald-300", textColor: "text-emerald-700" },
];

// Filter options
const FILTERS = {
  all: "All",
  highRisk: "High-Risk",
  behindSchedule: "Behind Schedule",
  demoWeek: "Demo Week",
  myRfps: "My RFPs",
};

interface RFP {
  id: string;
  title: string;
  budget: number | null;
  createdAt: Date;
  timelineStateSnapshot: any;
  decisionBriefSnapshot: any;
  opportunityScore: number | null;
  company: { name: string };
  supplier: { name: string };
  supplierResponses: { id: string }[];
}

interface LifecycleBoardProps {
  initialRfps: RFP[];
}

export default function LifecycleBoard({ initialRfps }: LifecycleBoardProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Group RFPs by phase
  const rfpsByPhase = useMemo(() => {
    const grouped: Record<string, RFP[]> = {};
    
    LIFECYCLE_PHASES.forEach(phase => {
      grouped[phase.id] = [];
    });

    initialRfps.forEach(rfp => {
      // Extract phase from timelineStateSnapshot
      let phase = "PLANNING"; // default
      
      if (rfp.timelineStateSnapshot && typeof rfp.timelineStateSnapshot === "object") {
        const snapshot = rfp.timelineStateSnapshot as any;
        if (snapshot.currentPhase && snapshot.currentPhase.phaseId) {
          phase = snapshot.currentPhase.phaseId;
        }
      }

      // Ensure phase exists in grouped object
      if (grouped[phase]) {
        grouped[phase].push(rfp);
      } else {
        // If phase not recognized, default to PLANNING
        grouped["PLANNING"].push(rfp);
      }
    });

    return grouped;
  }, [initialRfps]);

  // Apply filters
  const filteredRfpsByPhase = useMemo(() => {
    if (activeFilter === "all") {
      return rfpsByPhase;
    }

    const filtered: Record<string, RFP[]> = {};
    
    LIFECYCLE_PHASES.forEach(phase => {
      filtered[phase.id] = rfpsByPhase[phase.id].filter(rfp => {
        if (activeFilter === "highRisk") {
          // Check for high risk (placeholder logic - could be enhanced)
          return rfp.decisionBriefSnapshot && 
                 rfp.decisionBriefSnapshot.riskAnalysis && 
                 rfp.decisionBriefSnapshot.riskAnalysis.highRiskCount > 0;
        }
        
        if (activeFilter === "behindSchedule") {
          // Check if award target is past and no award yet
          if (rfp.timelineStateSnapshot && rfp.timelineStateSnapshot.nextEvents) {
            const awardEvent = rfp.timelineStateSnapshot.nextEvents.find((e: any) => 
              e.label && e.label.includes("Award")
            );
            if (awardEvent && awardEvent.at) {
              const awardDate = new Date(awardEvent.at);
              return awardDate < new Date();
            }
          }
          return false;
        }
        
        if (activeFilter === "demoWeek") {
          // Check if demo window is this week
          if (rfp.timelineStateSnapshot) {
            const snapshot = rfp.timelineStateSnapshot as any;
            if (snapshot.isDemoWindowOpen) {
              return true;
            }
            // Check if demo window starts this week
            if (snapshot.nextEvents) {
              const demoEvent = snapshot.nextEvents.find((e: any) => 
                e.label && e.label.includes("Demo")
              );
              if (demoEvent && demoEvent.at) {
                const demoDate = new Date(demoEvent.at);
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return demoDate >= now && demoDate <= weekFromNow;
              }
            }
          }
          return false;
        }
        
        if (activeFilter === "myRfps") {
          // In this context, all RFPs are already "my RFPs" since we filter by userId
          // This could be enhanced to filter by specific owner if needed
          return true;
        }
        
        return true;
      });
    });

    return filtered;
  }, [rfpsByPhase, activeFilter]);

  // Count total RFPs after filtering
  const totalFilteredRfps = useMemo(() => {
    return Object.values(filteredRfpsByPhase).reduce((sum, rfps) => sum + rfps.length, 0);
  }, [filteredRfpsByPhase]);

  return (
    <div className="p-6 space-y-6">
      {/* Filter Bar */}
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        data-demo="lifecycle-filter-bar"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
          <div className="flex items-center space-x-2">
            {Object.entries(FILTERS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === key
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-gray-600">
            {totalFilteredRfps} RFPs
          </span>
        </div>
      </div>

      {/* Phase Columns */}
      <div className="grid grid-cols-7 gap-4">
        {LIFECYCLE_PHASES.map(phase => (
          <div
            key={phase.id}
            className="flex flex-col"
            data-demo={`lifecycle-phase-${phase.id.toLowerCase().replace('_', '-')}`}
          >
            {/* Column Header */}
            <Link
              href={`/dashboard/rfps/lifecycle/${phase.id}`}
              className="block group"
            >
              <div className={`${phase.color} border-2 rounded-t-lg p-3 group-hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${phase.textColor}`}>
                    {phase.label}
                  </h3>
                  <span className={`text-xs font-semibold ${phase.textColor} bg-white px-2 py-0.5 rounded-full`}>
                    {filteredRfpsByPhase[phase.id].length}
                  </span>
                </div>
              </div>
            </Link>

            {/* RFP Cards */}
            <div className="bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-200 rounded-b-lg p-2 space-y-2 min-h-[300px] max-h-[600px] overflow-y-auto">
              {filteredRfpsByPhase[phase.id].length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No RFPs
                </div>
              ) : (
                filteredRfpsByPhase[phase.id].map(rfp => (
                  <RfpCard key={rfp.id} rfp={rfp} phaseId={phase.id} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// RFP Card Component
function RfpCard({ rfp, phaseId }: { rfp: RFP; phaseId: string }) {
  // Get opportunity rating
  const opportunityRating = rfp.opportunityScore !== null 
    ? getOpportunityRating(rfp.opportunityScore) 
    : null;

  // Extract critical date based on phase
  const getCriticalDate = () => {
    if (!rfp.timelineStateSnapshot) return null;
    const snapshot = rfp.timelineStateSnapshot as any;
    
    if (!snapshot.nextEvents || snapshot.nextEvents.length === 0) return null;
    
    const nextEvent = snapshot.nextEvents[0];
    if (!nextEvent.at) return null;
    
    const eventDate = new Date(nextEvent.at);
    const label = nextEvent.label || "Upcoming";
    
    return { label, date: eventDate };
  };

  const criticalDate = getCriticalDate();

  return (
    <Link
      href={`/dashboard/rfps/${rfp.id}`}
      data-demo="lifecycle-rfp-card"
    >
      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
        {/* Title and Score */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {rfp.title}
          </h4>
          {opportunityRating && (
            <div
              className={`ml-2 flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${opportunityRating.bgColor} ${opportunityRating.textColor}`}
              title={`Opportunity Score: ${rfp.opportunityScore} (${opportunityRating.label})`}
            >
              {rfp.opportunityScore}
            </div>
          )}
        </div>

        {/* Budget */}
        {rfp.budget && (
          <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
            <DollarSign className="w-3 h-3" />
            <span>${rfp.budget.toLocaleString()}</span>
          </div>
        )}

        {/* Supplier Engagement */}
        <div className="flex items-center space-x-1 text-xs text-gray-600 mb-2">
          <Users className="w-3 h-3" />
          <span>Suppliers Engaged: {rfp.supplierResponses.length}</span>
        </div>

        {/* Critical Date */}
        {criticalDate && (
          <div className="flex items-center space-x-1 text-xs text-gray-700 bg-gray-50 rounded px-2 py-1">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">{criticalDate.label}:</span>
            <span>{criticalDate.date.toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
