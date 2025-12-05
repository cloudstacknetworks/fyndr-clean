"use client";

/**
 * STEP 64: Scoring Variance Chart
 * Bar chart showing RFPs with high variance in supplier scores
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

interface ScoringVarianceData {
  rfpId: string;
  rfpTitle: string;
  varianceValue: number;
  highScore: number;
  lowScore: number;
}

interface ScoringVarianceChartProps {
  data: ScoringVarianceData[];
}

export default function ScoringVarianceChart({ data }: ScoringVarianceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No scoring variance data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.rfpTitle.substring(0, 30) + (d.rfpTitle.length > 30 ? "..." : "")),
    datasets: [
      {
        label: "Score Variance",
        data: data.map((d) => d.varianceValue),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgb(239, 68, 68)",
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
            const item = data[context.dataIndex];
            return [
              `Variance: ${item.varianceValue.toFixed(1)}`,
              `High: ${item.highScore.toFixed(1)}`,
              `Low: ${item.lowScore.toFixed(1)}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
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
