import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface TopSupplier {
  rfpId: string;
  rfpTitle: string;
  topSupplier: string;
  organization: string;
  score: number;
}

interface ComparisonData {
  topSuppliers: TopSupplier[];
}

async function fetchComparisonData(): Promise<ComparisonData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/comparison`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch comparison data');
  }

  return res.json();
}

export default async function ComparisonWidget() {
  try {
    const data = await fetchComparisonData();

    if (data.topSuppliers.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Top Suppliers</h3>
          </div>
          <p className="text-gray-500 text-sm">No comparisons run yet</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Top Suppliers</h3>
        </div>
        
        <div className="space-y-3">
          {data.topSuppliers.map((item) => (
            <Link 
              key={item.rfpId}
              href={`/dashboard/rfps/${item.rfpId}/compare`}
              className="block hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.topSupplier}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {item.rfpTitle}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {Math.round(item.score)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Comparison widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Top Suppliers</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
