import { Search } from "lucide-react";

interface SearchItem {
  eventType: string;
  summary: string;
  createdAt: string;
}

interface SearchData {
  recentSearches: SearchItem[];
  searchEnabled: boolean;
}

async function fetchSearchData(): Promise<SearchData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/search`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch search data');
  }

  return res.json();
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function SearchWidget() {
  try {
    const data = await fetchSearchData();

    if (data.recentSearches.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        
        <div className="space-y-2">
          {data.recentSearches.map((item, idx) => (
            <div key={idx} className="text-sm py-2 border-b border-gray-100 last:border-0">
              <div className="font-medium text-gray-900 truncate">{item.summary}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {getRelativeTime(item.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Search widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
