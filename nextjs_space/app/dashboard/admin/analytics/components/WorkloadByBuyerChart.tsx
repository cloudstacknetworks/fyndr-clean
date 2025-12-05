"use client";

/**
 * STEP 64: Workload by Buyer Chart
 * Stacked bar chart showing active and closed RFPs per buyer
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

interface WorkloadData {
  buyerId: string;
  buyerName: string;
  activeRfps: number;
  closedRfps: number;
}

interface WorkloadByBuyerChartProps {
  data: WorkloadData[];
}

export default function WorkloadByBuyerChart({ data }: WorkloadByBuyerChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No buyer workload data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.buyerName),
    datasets: [
      {
        label: "Active RFPs",
        data: data.map((d) => d.activeRfps),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
      {
        label: "Closed RFPs",
        data: data.map((d) => d.closedRfps),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
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
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
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
