"use client";

/**
 * STEP 64: Admin Analytics Dashboard Client Component
 * 
 * Fetches and displays portfolio-level analytics including:
 * - KPI tiles (6 metrics)
 * - Charts (12+ visualizations)
 * - Filtering capabilities (date range, buyer, stage, status)
 */

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Award,
  Zap,
  Filter,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { AdminAnalyticsDashboard } from "@/lib/analytics/admin-analytics-service";
import KPITile from "./components/KPITile";
import RfpVolumeChart from "./components/RfpVolumeChart";
import StageDistributionChart from "./components/StageDistributionChart";
import CycleTimeByStageChart from "./components/CycleTimeByStageChart";
import SupplierParticipationChart from "./components/SupplierParticipationChart";
import SupplierPerformanceTable from "./components/SupplierPerformanceTable";
import ScoringVarianceChart from "./components/ScoringVarianceChart";
import AutomationImpactCard from "./components/AutomationImpactCard";
import AiUsageCard from "./components/AiUsageCard";
import ExportUsageChart from "./components/ExportUsageChart";
import WorkloadByBuyerChart from "./components/WorkloadByBuyerChart";
import OutcomeTrendsChart from "./components/OutcomeTrendsChart";

interface AdminAnalyticsDashboardClientProps {
  userId: string;
  userRole: string;
  companyId: string;
}

export default function AdminAnalyticsDashboardClient({
  userId,
  userRole,
  companyId,
}: AdminAnalyticsDashboardClientProps) {
  const [dashboard, setDashboard] = useState<AdminAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [dateRange, setDateRange] = useState<string>("last_90_days");
  const [buyerId, setBuyerId] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [status, setStatus] = useState<string>("all");

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        dateRange,
        ...(buyerId && { buyerId }),
        ...(stage && { stage }),
        status,
      });

      const response = await fetch(`/api/admin/analytics/dashboard?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const result = await response.json();
      setDashboard(result.data);
    } catch (err: any) {
      console.error("Error fetching admin analytics:", err);
      setError(err.message || "Failed to load analytics dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dateRange, buyerId, stage, status]);

  // ========================================
  // Render Loading State
  // ========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // Render Error State
  // ========================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => fetchDashboard()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // Render Dashboard
  // ========================================
  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const { kpis, charts } = dashboard;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ========================================
          Header Section
          ======================================== */}
      <div className="mb-8" data-demo="admin-analytics-header">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Analytics</h1>
        <p className="text-gray-600">
          Portfolio-level insights across all RFP activity, suppliers, scoring, and automation.
        </p>
      </div>

      {/* ========================================
          Filters Section
          ======================================== */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={() => {
              setDateRange("last_90_days");
              setBuyerId("");
              setStage("");
              setStatus("all");
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="last_180_days">Last 180 Days</option>
              <option value="last_365_days">Last 365 Days</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All RFPs</option>
              <option value="active">Active Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>

          {/* Placeholder for future filters */}
          <div className="col-span-2 flex items-end">
            <button
              onClick={() => fetchDashboard()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ========================================
          KPI Tiles Section
          ======================================== */}
      <div className="mb-8" data-demo="admin-analytics-kpis">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPITile
            label="Active RFPs"
            value={kpis.activeRfps}
            icon={BarChart3}
            color="blue"
          />
          <KPITile
            label="RFPs Closed"
            value={kpis.closedRfps}
            sublabel="In selected period"
            icon={Award}
            color="green"
          />
          <KPITile
            label="Avg Cycle Time"
            value={`${kpis.avgCycleTimeDays} days`}
            icon={Clock}
            color="purple"
          />
          <KPITile
            label="Win Rate"
            value={`${kpis.winRatePercent}%`}
            icon={TrendingUp}
            color="emerald"
          />
          <KPITile
            label="Avg Suppliers/RFP"
            value={kpis.avgSuppliersPerRfp}
            sublabel={`${kpis.participationRate}% acceptance`}
            icon={Users}
            color="orange"
          />
          <KPITile
            label="Automation Runs"
            value={kpis.automationRunsCount}
            sublabel={`${kpis.aiScoringRunsCount} AI scoring runs`}
            icon={Zap}
            color="indigo"
          />
        </div>
      </div>

      {/* ========================================
          Pipeline & Volume Section
          ======================================== */}
      <div className="mb-8" data-demo="admin-analytics-pipeline">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pipeline & Volume</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RFP Volume Over Time</h3>
            <RfpVolumeChart data={charts.rfpVolumeOverTime} />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
            <StageDistributionChart data={charts.stageDistribution} />
          </div>
        </div>
      </div>

      {/* ========================================
          Cycle Time & Bottlenecks Section
          ======================================== */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cycle Time & Bottlenecks</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Average Cycle Time by Stage
          </h3>
          <CycleTimeByStageChart data={charts.cycleTimeByStage} />
        </div>
      </div>

      {/* ========================================
          Supplier Participation & Performance Section
          ======================================== */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Supplier Participation & Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Participation Funnel</h3>
            <SupplierParticipationChart data={charts.supplierParticipationFunnel} />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Suppliers by Awards
            </h3>
            <SupplierPerformanceTable data={charts.supplierPerformance} />
          </div>
        </div>
      </div>

      {/* ========================================
          Scoring & Evaluation Quality Section
          ======================================== */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Scoring & Evaluation Quality
        </h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Scoring Variance (Top 10 RFPs)
          </h3>
          <ScoringVarianceChart data={charts.scoringVariance} />
        </div>
      </div>

      {/* ========================================
          Automation & AI Usage Section
          ======================================== */}
      <div className="mb-8" data-demo="admin-analytics-automation">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Automation & AI Usage</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AutomationImpactCard data={charts.automationImpact} />
          <AiUsageCard data={charts.aiUsage} />
        </div>
      </div>

      {/* ========================================
          Export Usage & Workload Section
          ======================================== */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Usage & Workload</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Exports (Last Period)
            </h3>
            <ExportUsageChart data={charts.exportUsage} />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workload by Buyer</h3>
            <WorkloadByBuyerChart data={charts.workloadByBuyer} />
          </div>
        </div>
      </div>

      {/* ========================================
          Outcome Trends Section
          ======================================== */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outcome Trends</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Awards vs Cancellations Over Time
          </h3>
          <OutcomeTrendsChart data={charts.outcomeTrends} />
        </div>
      </div>
    </div>
  );
}
