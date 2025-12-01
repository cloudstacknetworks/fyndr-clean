"use client";

import { Clock, MessageSquare, Upload, Video, Award } from "lucide-react";

interface TimelineBarProps {
  inviteDate?: Date | null;
  qaWindowStart?: Date | null;
  qaWindowEnd?: Date | null;
  submissionWindowStart?: Date | null;
  submissionWindowEnd?: Date | null;
  demoWindowStart?: Date | null;
  demoWindowEnd?: Date | null;
  awardDate?: Date | null;
}

export default function SupplierTimelineBar(props: TimelineBarProps) {
  const now = new Date();

  const events = [
    {
      label: "Invited",
      date: props.inviteDate,
      icon: <Clock className="h-4 w-4" />,
      status: props.inviteDate ? "complete" : "pending"
    },
    {
      label: "Q&A Window",
      date: props.qaWindowEnd,
      icon: <MessageSquare className="h-4 w-4" />,
      status: getWindowStatus(props.qaWindowStart, props.qaWindowEnd, now)
    },
    {
      label: "Submission",
      date: props.submissionWindowEnd,
      icon: <Upload className="h-4 w-4" />,
      status: getWindowStatus(props.submissionWindowStart, props.submissionWindowEnd, now)
    },
    {
      label: "Demo",
      date: props.demoWindowEnd,
      icon: <Video className="h-4 w-4" />,
      status: getWindowStatus(props.demoWindowStart, props.demoWindowEnd, now)
    },
    {
      label: "Award",
      date: props.awardDate,
      icon: <Award className="h-4 w-4" />,
      status: props.awardDate && props.awardDate < now ? "complete" : "pending"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        {events.map((event, index) => (
          <div key={index} className="flex items-center">
            <TimelineEvent {...event} />
            {index < events.length - 1 && (
              <div className="w-12 h-0.5 bg-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineEvent({ label, date, icon, status }: any) {
  const colorClasses = {
    complete: "bg-green-100 text-green-600 border-green-300",
    active: "bg-blue-100 text-blue-600 border-blue-300",
    pending: "bg-gray-100 text-gray-400 border-gray-300",
    closed: "bg-red-100 text-red-600 border-red-300"
  };

  return (
    <div className="flex flex-col items-center group relative" data-demo-element="timeline-event">
      <div className={`p-2 rounded-full border-2 ${colorClasses[status as keyof typeof colorClasses]}`}>
        {icon}
      </div>
      <div className="text-xs mt-1 text-center">{label}</div>
      
      {/* Tooltip */}
      {date && (
        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          {new Date(date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function getWindowStatus(start: Date | null | undefined, end: Date | null | undefined, now: Date): string {
  if (!start || !end) return "pending";
  if (now < start) return "pending";
  if (now >= start && now <= end) return "active";
  return "closed";
}
