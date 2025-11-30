import { Target } from "lucide-react";

interface CoverageItem {
  supplier: string;
  rfpTitle: string;
  coverage: number;
}

interface CoverageData {
  coverageData: CoverageItem[];
}

async function fetchCoverageData(): Promise<CoverageData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/coverage`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch coverage data');
  }

  return res.json();
}

function getCoverageColor(coverage: number): string {
  if (coverage >= 80) return 'bg-green-500';
  if (coverage >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default async function CoverageWidget() {
  try {
    const data = await fetchCoverageData();

    if (data.coverageData.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Requirements Coverage</h3>
          </div>
          <p className="text-gray-500 text-sm">No coverage data available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Requirements Coverage</h3>
        </div>
        
        <div className="space-y-3">
          {data.coverageData.slice(0, 5).map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate flex-1">{item.supplier}</span>
                <span className="font-semibold text-gray-900 ml-2">{item.coverage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getCoverageColor(item.coverage)}`}
                  style={{ width: `${item.coverage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Coverage widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Requirements Coverage</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
