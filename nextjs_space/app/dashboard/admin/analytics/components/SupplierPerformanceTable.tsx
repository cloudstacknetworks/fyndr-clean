"use client";

/**
 * STEP 64: Supplier Performance Table
 * Sortable table showing top suppliers by awards, participation, and avg score
 */

import { useState } from "react";
import { ArrowUpDown, Trophy, TrendingUp } from "lucide-react";

interface SupplierPerformanceData {
  supplierId: string;
  supplierName: string;
  awardsWon: number;
  avgScore: number | null;
  participationCount: number;
}

interface SupplierPerformanceTableProps {
  data: SupplierPerformanceData[];
}

export default function SupplierPerformanceTable({ data }: SupplierPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<"awardsWon" | "avgScore" | "participationCount">("awardsWon");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <p>No supplier performance data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDirection === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
  });

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supplier
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("awardsWon")}
            >
              <div className="flex items-center gap-1">
                Awards
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("avgScore")}
            >
              <div className="flex items-center gap-1">
                Avg Score
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("participationCount")}
            >
              <div className="flex items-center gap-1">
                Participation
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((supplier) => (
            <tr key={supplier.supplierId} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{supplier.supplierName}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {supplier.awardsWon > 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                  <span className="text-sm text-gray-900">{supplier.awardsWon}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {supplier.avgScore !== null ? supplier.avgScore.toFixed(1) : "N/A"}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-gray-900">{supplier.participationCount}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
