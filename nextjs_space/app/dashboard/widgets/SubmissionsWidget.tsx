import { Send, Clock } from "lucide-react";
import Link from "next/link";

interface Deadline {
  rfpId: string;
  rfpTitle: string;
  deadline: string | null;
  daysUntil: number | null;
}

interface SubmissionsData {
  deadlines: Deadline[];
}

async function fetchSubmissionsData(): Promise<SubmissionsData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/submissions`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch submissions data');
  }

  return res.json();
}

function getDaysLabel(days: number | null): { text: string; color: string } {
  if (days === null) return { text: 'TBD', color: 'text-gray-500' };
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-red-600' };
  if (days === 0) return { text: 'Today!', color: 'text-red-600 font-bold' };
  if (days === 1) return { text: 'Tomorrow', color: 'text-amber-600' };
  if (days <= 3) return { text: `${days} days`, color: 'text-amber-600' };
  return { text: `${days} days`, color: 'text-gray-700' };
}

export default async function SubmissionsWidget() {
  try {
    const data = await fetchSubmissionsData();

    if (data.deadlines.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Submission Deadlines</h3>
          </div>
          <p className="text-gray-500 text-sm">No upcoming deadlines</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Submission Deadlines</h3>
        </div>
        
        <div className="space-y-3">
          {data.deadlines.slice(0, 5).map((deadline) => {
            const daysInfo = getDaysLabel(deadline.daysUntil);
            return (
              <Link 
                key={deadline.rfpId}
                href={`/dashboard/rfps/${deadline.rfpId}`}
                className="block hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {deadline.rfpTitle}
                    </div>
                    <div className={`text-xs font-medium ${daysInfo.color}`}>
                      {daysInfo.text}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Submissions widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Submission Deadlines</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
