"use client";

/**
 * STEP 64: Export Usage Chart
 * Horizontal bar chart showing most-used export types
 */

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ExportUsageData {
  exportId: string;
  exportTitle: string;
  count: number;
}

interface ExportUsageChartProps {
  data: ExportUsageData[];
}

export default function ExportUsageChart({ data }: ExportUsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No export usage data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.exportTitle),
    datasets: [
      {
        label: "Exports",
        data: data.map((d) => d.count),
        backgroundColor: "rgba(14, 165, 233, 0.7)",
        borderColor: "rgb(14, 165, 233)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.x} exports`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
