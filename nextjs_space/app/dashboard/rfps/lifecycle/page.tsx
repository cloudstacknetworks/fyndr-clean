import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import LifecycleBoard from "./lifecycle-board";
import { Option3Indicator } from "@/app/components/option3/option3-indicator";

export default async function LifecyclePage() {
  const session = await getServerSession(authOptions);
  
  // Buyer-only access
  if (!session || !session.user) {
    redirect("/login");
  }
  
  if (session.user.role !== "buyer") {
    redirect("/dashboard");
  }

  // Fetch all RFPs for the authenticated buyer with timeline state
  const rfps = await prisma.rFP.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      budget: true,
      createdAt: true,
      timelineStateSnapshot: true,
      decisionBriefSnapshot: true,
      opportunityScore: true,
      awardStatus: true,
      company: {
        select: {
          name: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
      supplierResponses: {
        where: {
          status: "SUBMITTED",
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50" data-demo="lifecycle-board">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/rfps"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                RFP Lifecycle Board
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Visual overview of all RFPs by lifecycle phase
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Option3Indicator />
          </div>
        </div>
      </div>

      {/* Lifecycle Board Component */}
      <LifecycleBoard initialRfps={rfps} />
    </div>
  );
}
