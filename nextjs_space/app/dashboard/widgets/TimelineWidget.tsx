import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface TimelineEvent {
  type: string;
  date: string;
  rfpTitle: string;
  rfpId: string;
}

interface TimelineData {
  events: TimelineEvent[];
}

async function fetchTimelineData(): Promise<TimelineData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/timeline`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch timeline data');
  }

  return res.json();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function TimelineWidget() {
  try {
    const data = await fetchTimelineData();

    if (data.events.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
          </div>
          <p className="text-gray-500 text-sm">No events in the next 7 days</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
        </div>
        
        <div className="space-y-3">
          {data.events.slice(0, 5).map((event, idx) => (
            <Link 
              key={idx} 
              href={`/dashboard/rfps/${event.rfpId}`}
              className="block hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {event.type}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {event.rfpTitle}
                  </div>
                  <div className="text-xs text-purple-600 font-medium">
                    {formatDate(event.date)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Timeline widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
