"use client";

/**
 * STEP 64: Cycle Time by Stage Chart
 * Horizontal bar chart showing average days spent in each stage
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

interface CycleTimeData {
  stage: string;
  avgDays: number;
}

interface CycleTimeByStageChartProps {
  data: CycleTimeData[];
}

export default function CycleTimeByStageChart({ data }: CycleTimeByStageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No closed RFPs in selected period</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.stage.replace(/_/g, " ")),
    datasets: [
      {
        label: "Avg Days",
        data: data.map((d) => d.avgDays),
        backgroundColor: "rgba(168, 85, 247, 0.7)",
        borderColor: "rgb(168, 85, 247)",
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
            return `${context.parsed.x} days`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
