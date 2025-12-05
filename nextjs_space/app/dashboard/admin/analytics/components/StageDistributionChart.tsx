"use client";

/**
 * STEP 64: Stage Distribution Chart
 * Bar chart showing current count of RFPs by stage
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

interface StageDistributionData {
  stage: string;
  count: number;
}

interface StageDistributionChartProps {
  data: StageDistributionData[];
}

export default function StageDistributionChart({ data }: StageDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No active RFPs</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.stage.replace(/_/g, " ")),
    datasets: [
      {
        label: "RFPs",
        data: data.map((d) => d.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(168, 85, 247, 0.7)",
          "rgba(236, 72, 153, 0.7)",
          "rgba(251, 146, 60, 0.7)",
          "rgba(34, 197, 94, 0.7)",
          "rgba(14, 165, 233, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(239, 68, 68, 0.7)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(168, 85, 247)",
          "rgb(236, 72, 153)",
          "rgb(251, 146, 60)",
          "rgb(34, 197, 94)",
          "rgb(14, 165, 233)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.y} RFPs`;
          },
        },
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
      <Bar data={chartData} options={options} />
    </div>
  );
}
