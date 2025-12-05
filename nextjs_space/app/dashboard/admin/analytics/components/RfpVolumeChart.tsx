"use client";

/**
 * STEP 64: RFP Volume Over Time Chart
 * Line/bar chart showing RFPs created, awarded, and cancelled over time
 */

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface RfpVolumeData {
  bucket: string;
  createdCount: number;
  awardedCount: number;
  cancelledCount: number;
}

interface RfpVolumeChartProps {
  data: RfpVolumeData[];
}

export default function RfpVolumeChart({ data }: RfpVolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No data available for selected period</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.bucket),
    datasets: [
      {
        label: "Created",
        data: data.map((d) => d.createdCount),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Awarded",
        data: data.map((d) => d.awardedCount),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Cancelled",
        data: data.map((d) => d.cancelledCount),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
