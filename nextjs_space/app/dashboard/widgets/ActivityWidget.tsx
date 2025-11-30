import { Activity } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  id: string;
  eventType: string;
  summary: string;
  createdAt: string;
  rfp: {
    id: string;
    title: string;
  } | null;
}

interface ActivityData {
  activities: ActivityItem[];
}

async function fetchActivityData(): Promise<ActivityData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/activity`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch activity data');
  }

  return res.json();
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function ActivityWidget() {
  try {
    const data = await fetchActivityData();

    if (data.activities.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {data.activities.slice(0, 10).map((activity) => (
            <div 
              key={activity.id}
              className="text-sm py-2 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900 truncate">
                {activity.summary}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {activity.rfp && (
                  <Link 
                    href={`/dashboard/rfps/${activity.rfp.id}`}
                    className="text-xs text-blue-600 hover:underline truncate"
                  >
                    {activity.rfp.title}
                  </Link>
                )}
                <span className="text-xs text-gray-500">
                  {getRelativeTime(activity.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Activity widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
