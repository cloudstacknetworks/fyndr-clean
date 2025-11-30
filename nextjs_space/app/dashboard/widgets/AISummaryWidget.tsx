import { Sparkles } from "lucide-react";

interface AISummaryData {
  summary: string;
  metrics: {
    activeRFPs: number;
    pendingQuestions: number;
    upcomingDeadlines: number;
  };
}

async function fetchAISummaryData(): Promise<AISummaryData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/ai-summary`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch AI summary data');
  }

  return res.json();
}

export default async function AISummaryWidget() {
  try {
    const data = await fetchAISummaryData();

    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow p-6 col-span-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Executive Summary</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {data.summary}
          </p>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-200">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{data.metrics.activeRFPs}</div>
              <div className="text-xs text-gray-600">Active RFPs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{data.metrics.pendingQuestions}</div>
              <div className="text-xs text-gray-600">Pending Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{data.metrics.upcomingDeadlines}</div>
              <div className="text-xs text-gray-600">Deadlines This Week</div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AI Summary widget error:', error);
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow p-6 col-span-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Executive Summary</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load summary</p>
      </div>
    );
  }
}
