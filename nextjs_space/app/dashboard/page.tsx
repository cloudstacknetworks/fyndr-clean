import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import PipelineWidget from "./widgets/PipelineWidget";
import SLAWidget from "./widgets/SLAWidget";
import TimelineWidget from "./widgets/TimelineWidget";
import ActivityWidget from "./widgets/ActivityWidget";
import QuestionsWidget from "./widgets/QuestionsWidget";
import SubmissionsWidget from "./widgets/SubmissionsWidget";
import ReadinessWidget from "./widgets/ReadinessWidget";
import ComparisonWidget from "./widgets/ComparisonWidget";
import PricingWidget from "./widgets/PricingWidget";
import CoverageWidget from "./widgets/CoverageWidget";
import VelocityWidget from "./widgets/VelocityWidget";
import AISummaryWidget from "./widgets/AISummaryWidget";
import ExportsWidget from "./widgets/ExportsWidget";
import SearchWidget from "./widgets/SearchWidget";

function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "buyer") {
    redirect("/login");
  }

  // STEP 50: Redirect buyers to the Home Dashboard as default landing page
  if (session.user.role === "buyer") {
    redirect("/dashboard/home");
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Executive overview of your RFP pipeline</p>
      </div>

      {/* AI Executive Summary - Full Width */}
      <Suspense fallback={<WidgetSkeleton />}>
        <AISummaryWidget />
      </Suspense>

      {/* TIER 1: Top Priority Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<WidgetSkeleton />}>
          <PipelineWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <SLAWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <TimelineWidget />
        </Suspense>
      </div>

      {/* TIER 2: Middle Row - Activity & Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<WidgetSkeleton />}>
          <ActivityWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <QuestionsWidget />
        </Suspense>
      </div>

      {/* TIER 3: Submissions & Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<WidgetSkeleton />}>
          <SubmissionsWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <ReadinessWidget />
        </Suspense>
      </div>

      {/* TIER 4: Comparison & Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<WidgetSkeleton />}>
          <ComparisonWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <PricingWidget />
        </Suspense>
      </div>

      {/* TIER 5: Coverage & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<WidgetSkeleton />}>
          <CoverageWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <VelocityWidget />
        </Suspense>
      </div>

      {/* TIER 6: Exports & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<WidgetSkeleton />}>
          <ExportsWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <SearchWidget />
        </Suspense>
      </div>
    </div>
  );
}
