import { CheckCircle } from "lucide-react";

interface ReadinessData {
  distribution: {
    READY: number;
    CONDITIONAL: number;
    NOT_READY: number;
    UNKNOWN: number;
  };
  total: number;
}

async function fetchReadinessData(): Promise<ReadinessData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/readiness`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch readiness data');
  }

  return res.json();
}

export default async function ReadinessWidget() {
  try {
    const data = await fetchReadinessData();

    if (data.total === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Supplier Readiness</h3>
          </div>
          <p className="text-gray-500 text-sm">No responses yet</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Supplier Readiness</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700">Ready</span>
            </div>
            <span className="font-semibold text-green-600">{data.distribution.READY}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-700">Conditional</span>
            </div>
            <span className="font-semibold text-amber-600">{data.distribution.CONDITIONAL}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Not Ready</span>
            </div>
            <span className="font-semibold text-red-600">{data.distribution.NOT_READY}</span>
          </div>
          
          {data.distribution.UNKNOWN > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-700">Unknown</span>
              </div>
              <span className="font-semibold text-gray-600">{data.distribution.UNKNOWN}</span>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-gray-500">Total Responses: {data.total}</div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Readiness widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Supplier Readiness</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
