import { DollarSign } from "lucide-react";

interface PricingTrend {
  rfpTitle: string;
  totalCost: number;
  submittedAt: string | undefined;
}

interface PricingData {
  pricingTrends: PricingTrend[];
}

async function fetchPricingData(): Promise<PricingData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/pricing`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch pricing data');
  }

  return res.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function PricingWidget() {
  try {
    const data = await fetchPricingData();

    if (data.pricingTrends.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Pricing Trends</h3>
          </div>
          <p className="text-gray-500 text-sm">No pricing data available</p>
        </div>
      );
    }

    const avgCost = data.pricingTrends.length > 0
      ? Math.round(data.pricingTrends.reduce((sum, t) => sum + t.totalCost, 0) / data.pricingTrends.length)
      : 0;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Pricing Trends</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(avgCost)}</div>
            <div className="text-sm text-gray-600">Avg. Total Cost</div>
          </div>
          
          <div className="mt-4 space-y-2">
            {data.pricingTrends.slice(0, 5).map((trend, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate flex-1">{trend.rfpTitle}</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {formatCurrency(trend.totalCost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Pricing widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Pricing Trends</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
