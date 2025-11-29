"use client";

import { 
  getTimelineMilestones, 
  getStatusColor, 
  formatTimelineDate,
} from "@/lib/rfp-timeline";
import { RFP } from "@prisma/client";
import { Calendar, Clock } from "lucide-react";

type TimelineDetailsProps = {
  rfp: Pick<RFP, 
    'askQuestionsStart' | 'askQuestionsEnd' | 
    'submissionStart' | 'submissionEnd' | 
    'demoWindowStart' | 'demoWindowEnd' | 
    'awardDate'
  >;
};

export function RFPTimelineDetails({ rfp }: TimelineDetailsProps) {
  const milestones = getTimelineMilestones(rfp);

  // Check if any timeline fields are set
  const hasTimeline = milestones.some(m => m.start || m.end);

  if (!hasTimeline) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Details</h3>
      
      <div className="space-y-4">
        {milestones.map((milestone) => {
          const colors = getStatusColor(milestone.status);
          const hasData = milestone.start || milestone.end;
          
          return (
            <div 
              key={milestone.id}
              className={`p-4 rounded-lg border-2 ${hasData ? colors.bg : 'bg-gray-50'} ${
                hasData ? colors.border : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className={`h-5 w-5 ${hasData ? colors.text : 'text-gray-400'}`} />
                  <div>
                    <h4 className={`font-semibold ${hasData ? 'text-gray-900' : 'text-gray-500'}`}>
                      {milestone.label}
                    </h4>
                    {hasData ? (
                      <div className="mt-1 space-y-1">
                        {milestone.start && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Start:</span> {formatTimelineDate(milestone.start)}
                          </p>
                        )}
                        {milestone.end && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{milestone.start ? 'End' : 'Date'}:</span> {formatTimelineDate(milestone.end)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">Not Set</p>
                    )}
                  </div>
                </div>

                {hasData && (
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                      {milestone.status === 'active' && '🔵 Active'}
                      {milestone.status === 'future' && '⚪ Upcoming'}
                      {milestone.status === 'overdue' && '🔴 Overdue'}
                      {milestone.status === 'completed' && '✅ Done'}
                    </span>
                    {milestone.daysRemaining !== undefined && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${colors.text}`}>
                        <Clock className="h-3 w-3" />
                        <span>
                          {milestone.daysRemaining >= 0 
                            ? `${milestone.daysRemaining} days remaining` 
                            : `${Math.abs(milestone.daysRemaining)} days overdue`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
