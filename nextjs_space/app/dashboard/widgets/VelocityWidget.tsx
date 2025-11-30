import { Zap } from "lucide-react";

interface VelocityData {
  avgDaysToSubmit: number;
  samples: number;
}

async function fetchVelocityData(): Promise<VelocityData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/velocity`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch velocity data');
  }

  return res.json();
}

export default async function VelocityWidget() {
  try {
    const data = await fetchVelocityData();

    if (data.samples === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Response Velocity</h3>
          </div>
          <p className="text-gray-500 text-sm">No submissions yet</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Response Velocity</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-3xl font-bold text-yellow-600">{data.avgDaysToSubmit}</div>
            <div className="text-sm text-gray-600">Avg. Days to Submit</div>
          </div>
          
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500">
              Based on {data.samples} submission{data.samples !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Velocity widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Response Velocity</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
