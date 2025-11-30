import { Download } from "lucide-react";

interface ExportType {
  type: string;
  label: string;
  formats: string[];
}

interface ExportsData {
  exportTypes: ExportType[];
}

async function fetchExportsData(): Promise<ExportsData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/widgets/exports`, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch exports data');
  }

  return res.json();
}

export default async function ExportsWidget() {
  try {
    const data = await fetchExportsData();

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Available Exports</h3>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {data.exportTypes.map((exportType) => (
            <div key={exportType.type} className="text-sm py-2 border-b border-gray-100 last:border-0">
              <div className="font-medium text-gray-900">{exportType.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {exportType.formats.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Exports widget error:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Available Exports</h3>
        </div>
        <p className="text-red-600 text-sm">Failed to load data</p>
      </div>
    );
  }
}
