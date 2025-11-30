"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportBundleButtonProps {
  rfpId: string;
}

export default function ExportBundleButton({ rfpId }: ExportBundleButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportBundle = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/bundle/export`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rfp-${rfpId}-bundle-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      setError("Export failed. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExportBundle}
        disabled={isExporting}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Exporting Bundle...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Export Bundle
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
