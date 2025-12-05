"use client";

/**
 * STEP 64: KPI Tile Component
 * Displays a single KPI metric with icon and optional sublabel
 */

import { LucideIcon } from "lucide-react";

interface KPITileProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "emerald" | "orange" | "indigo" | "red" | "yellow";
}

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  emerald: "bg-emerald-100 text-emerald-600",
  orange: "bg-orange-100 text-orange-600",
  indigo: "bg-indigo-100 text-indigo-600",
  red: "bg-red-100 text-red-600",
  yellow: "bg-yellow-100 text-yellow-600",
};

export default function KPITile({ label, value, sublabel, icon: Icon, color = "blue" }: KPITileProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
