"use client";

import { 
  getTimelineMilestones, 
  getStatusColor, 
  formatTimelineDate,
  type TimelineMilestone 
} from "@/lib/rfp-timeline";
import { RFP } from "@prisma/client";
import ExportButtonsPanel from './export-buttons-panel';

type TimelineBarProps = {
  rfp: Pick<RFP, 
    'id' | 
    'askQuestionsStart' | 'askQuestionsEnd' | 
    'submissionStart' | 'submissionEnd' | 
    'demoWindowStart' | 'demoWindowEnd' | 
    'awardDate'
  >;
};

export function RFPTimelineBar({ rfp }: TimelineBarProps) {
  const milestones = getTimelineMilestones(rfp);

  // Check if any timeline fields are set
  const hasTimeline = milestones.some(m => m.start || m.end);

  if (!hasTimeline) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 text-center">
          No timeline milestones have been set for this RFP yet.{" "}
          <a href={`/dashboard/rfps/${(rfp as any).id}/edit`} className="text-blue-600 hover:underline">
            Add timeline dates
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">RFP Timeline</h3>
        <ExportButtonsPanel 
          rfpId={rfp.id} 
          exportType="timeline" 
          label="Export Timeline" 
          supportsPdf={true}
        />
      </div>
      
      {/* Timeline bar visualization */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300"></div>
        
        {/* Milestones */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, index) => {
            const colors = getStatusColor(milestone.status);
            const hasData = milestone.start || milestone.end;
            
            return (
              <div 
                key={milestone.id} 
                className="flex flex-col items-center relative"
                style={{ zIndex: 10 }}
              >
                {/* Dot */}
                <div
                  className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                    hasData ? `${colors.bg} ${colors.border}` : 'bg-gray-100 border-gray-300'
                  } shadow-md relative`}
                  title={
                    hasData
                      ? `${milestone.label}\n${formatTimelineDate(milestone.start)} - ${formatTimelineDate(milestone.end || milestone.start)}\n${milestone.daysRemaining !== undefined && milestone.daysRemaining >= 0 ? `${milestone.daysRemaining} days remaining` : 'Past due'}`
                      : `${milestone.label}: Not set`
                  }
                >
                  <span className={`text-xs font-bold ${hasData ? colors.text : 'text-gray-500'}`}>
                    {index + 1}
                  </span>
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center max-w-[120px]">
                  <p className={`text-sm font-semibold ${hasData ? 'text-gray-900' : 'text-gray-500'}`}>
                    {milestone.label}
                  </p>
                  {hasData && milestone.daysRemaining !== undefined && (
                    <p className={`text-xs mt-1 ${colors.text}`}>
                      {milestone.daysRemaining >= 0 
                        ? `${milestone.daysRemaining} days` 
                        : `${Math.abs(milestone.daysRemaining)} days ago`}
                    </p>
                  )}
                  {!hasData && (
                    <p className="text-xs text-gray-400 mt-1">Not Set</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-400"></div>
            <span className="text-gray-600">Future</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
            <span className="text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-500"></div>
            <span className="text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
            <span className="text-gray-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
