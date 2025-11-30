import { BarChart3 } from "lucide-react";
import { STAGE_LABELS } from "@/lib/stages";

interface PipelineData {
  total: number;
  stages: Record<string, number>;
}

async function fetchPipelineData(): Promise<PipelineData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/pipeline`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch pipeline data');
  }

  return res.json();
}

export default async function PipelineWidget() {
  try {
    const data = await fetchPipelineData();

    if (data.total === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Pipeline Overview</h3>
          </div>
          <p className="text-gray-500 text-sm">No RFPs in pipeline</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Pipeline Overview</h3>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-indigo-600">{data.total}</div>
          <div className="text-sm text-gray-600">Total Active RFPs</div>
          
          <div className="mt-4 space-y-2">
            {Object.entries(data.stages)
              .filter(([_, count]) => count > 0)
              .map(([stage, count]) => (
                <div key={stage} className="flex justify-between text-sm">
                  <span className="text-gray-700">{STAGE_LABELS[stage] || stage}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Pipeline widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Pipeline Overview</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
