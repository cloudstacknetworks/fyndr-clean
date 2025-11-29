import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { Plus } from "lucide-react";
import { getSlaStatus } from "@/lib/stage-sla";
import { STAGE_LABELS } from "@/lib/stages";
import { getOpportunityRating } from "@/lib/opportunity-scoring";

const prisma = new PrismaClient();

async function getRFPs() {
  try {
    const rfps = await prisma.rFP.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    return rfps;
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    return [];
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "published":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function RFPsPage() {
  const rfps = await getRFPs();

  return (
    <div className="max-w-6xl">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RFPs</h1>
            <p className="text-gray-600">Manage your Requests for Proposals (RFPs) here.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/rfps/board"
              className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Pipeline View
            </Link>
            <Link
              href="/dashboard/rfps/new"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create New RFP
            </Link>
          </div>
        </div>

        {rfps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No RFPs found</p>
            <p className="text-gray-400 mb-6">Get started by creating your first RFP</p>
            <Link
              href="/dashboard/rfps/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              <Plus className="h-5 w-5" />
              Create RFP
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Stage</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SLA Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
                </tr>
              </thead>
              <tbody>
                {rfps.map((rfp) => {
                  const slaStatus = getSlaStatus(rfp);
                  const opportunityRating = rfp.opportunityScore !== null 
                    ? getOpportunityRating(rfp.opportunityScore) 
                    : null;
                  
                  return (
                    <tr
                      key={rfp.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <Link
                          href={`/dashboard/rfps/${rfp.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {rfp.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">
                          {STAGE_LABELS[rfp.stage as keyof typeof STAGE_LABELS]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            rfp.status
                          )}`}
                        >
                          {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            slaStatus.status === 'ok'
                              ? 'bg-green-100 text-green-700'
                              : slaStatus.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {slaStatus.status === 'ok' && 'OK'}
                          {slaStatus.status === 'warning' && 'Warning'}
                          {slaStatus.status === 'breached' && 'Breached'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {opportunityRating ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${opportunityRating.bgColor} ${opportunityRating.textColor}`}
                          >
                            {rfp.opportunityScore}
                          </span>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {rfp.user?.name || rfp.user?.email || "Unknown"}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {formatDate(rfp.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
