"use client";

/**
 * STEP 64: Outcome Trends Chart
 * Line chart showing awarded vs cancelled RFPs over time
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
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface OutcomeTrendsData {
  bucket: string;
  awardedCount: number;
  cancelledCount: number;
}

interface OutcomeTrendsChartProps {
  data: OutcomeTrendsData[];
}

export default function OutcomeTrendsChart({ data }: OutcomeTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No outcome trends data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.bucket),
    datasets: [
      {
        label: "Awarded",
        data: data.map((d) => d.awardedCount),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.4,
      },
      {
        label: "Cancelled",
        data: data.map((d) => d.cancelledCount),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        tension: 0.4,
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
