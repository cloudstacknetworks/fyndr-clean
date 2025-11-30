import { AlertTriangle } from "lucide-react";

interface SLAData {
  red: number;
  yellow: number;
  green: number;
  total: number;
}

async function fetchSLAData(): Promise<SLAData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/sla`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch SLA data');
  }

  return res.json();
}

export default async function SLAWidget() {
  try {
    const data = await fetchSLAData();

    if (data.total === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold">SLA Status</h3>
          </div>
          <p className="text-gray-500 text-sm">No RFPs to monitor</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold">SLA Status</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Breached</span>
            </div>
            <span className="font-semibold text-red-600">{data.red}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-700">Warning</span>
            </div>
            <span className="font-semibold text-amber-600">{data.yellow}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700">On Track</span>
            </div>
            <span className="font-semibold text-green-600">{data.green}</span>
          </div>
          
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-gray-500">Total: {data.total} RFPs</div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SLA widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold">SLA Status</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
