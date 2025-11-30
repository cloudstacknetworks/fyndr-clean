import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { ArrowLeft, Calendar, User, Building2, Users, DollarSign, Flag, FileText, Edit, Share2, Mail, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import AISummary from "./ai-summary";
import StageTasks from "./stage-tasks";
import AIActionsPanel from "./ai-actions-panel";
import OpportunityScorePanel from "./opportunity-score-panel";
import { RFPTimelineBar } from "./rfp-timeline-bar";
import { RFPTimelineDetails } from "./rfp-timeline-details";
import SupplierContactsPanel from "./supplier-contacts-panel";
import SupplierResponsesPanel from "./supplier-responses-panel";
import SupplierQuestionsPanel from "./supplier-questions-panel";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/stages";
import { isAutomationTask } from "@/lib/stage-automation";
import { getSlaStatus } from "@/lib/stage-sla";
import { STAGE_AI_ACTIONS } from "@/lib/stage-ai-actions";

const prisma = new PrismaClient();

async function getRFP(id: string) {
  try {
    const rfp = await prisma.rFP.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
            description: true,
          },
        },
        supplier: {
          select: {
            name: true,
            contactEmail: true,
          },
        },
        summaryShares: {
          include: {
            contact: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            sentAt: 'desc',
          },
        },
        stageHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    return rfp;
  } catch (error) {
    console.error("Error fetching RFP:", error);
    return null;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
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

function getPriorityColor(priority: string) {
  switch (priority) {
    case "LOW":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "HIGH":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function RFPDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const rfp = await getRFP(params.id);

  if (!rfp) {
    notFound();
  }

  // Fetch users for changedBy in stage history
  const userIds = rfp.stageHistory
    .map((h) => h.changedBy)
    .filter((id): id is string => id !== null);
  
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, { id: string; email: string; name: string | null }>);

  // Fetch stage tasks for current stage
  const stageTasks = await prisma.stageTask.findMany({
    where: { rfpId: params.id, stage: rfp.stage },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch automation tasks (created after stage entry)
  const automationTasks = rfp.stageEnteredAt
    ? await prisma.stageTask.findMany({
        where: {
          rfpId: params.id,
          stage: rfp.stage,
          createdAt: {
            gte: rfp.stageEnteredAt
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    : [];

  // Filter to only automation tasks
  const automationLog = automationTasks.filter(task => {
    // Check if task title matches any automation task for this stage
    return isAutomationTask(task.title, rfp.stage);
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/rfps"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to RFPs
        </Link>
        <Link
          href={`/dashboard/rfps/${rfp.id}/edit`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Edit className="h-5 w-5" />
          Edit RFP
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{rfp.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  rfp.status
                )}`}
              >
                {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
              </span>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${STAGE_COLORS[rfp.stage] || 'bg-gray-100 text-gray-700'}`}
              >
                {STAGE_LABELS[rfp.stage] || rfp.stage}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(
                  rfp.priority
                )}`}
              >
                <Flag className="h-4 w-4" />
                {rfp.priority}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Created By</p>
              <p className="text-gray-900">
                {rfp.user?.name || rfp.user?.email || "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Created At</p>
              <p className="text-gray-900">{formatDate(rfp.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Company</p>
              <p className="text-gray-900">
                {rfp.company?.name || "Not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Supplier</p>
              <p className="text-gray-900">
                {rfp.supplier?.name || "Not specified"}
              </p>
            </div>
          </div>

          {rfp.dueDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Due Date</p>
                <p className="text-gray-900">{formatDateOnly(rfp.dueDate)}</p>
              </div>
            </div>
          )}

          {rfp.submittedAt && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Submitted At</p>
                <p className="text-gray-900">{formatDateOnly(rfp.submittedAt)}</p>
              </div>
            </div>
          )}

          {rfp.budget !== null && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Budget</p>
                <p className="text-gray-900 font-semibold text-lg">
                  {formatCurrency(rfp.budget)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          {rfp.description ? (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {rfp.description}
            </p>
          ) : (
            <p className="text-gray-400 italic">No description provided</p>
          )}
        </div>

        {rfp.internalNotes && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">Internal Notes</h2>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-semibold">
                INTERNAL USE ONLY
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {rfp.internalNotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Contacts Panel - STEP 15 */}
      <div className="mt-6">
        <SupplierContactsPanel rfpId={rfp.id} />
      </div>

      {/* Supplier Responses Panel - STEP 16 */}
      <div className="mt-6">
        <SupplierResponsesPanel rfpId={rfp.id} />
      </div>

      {/* Supplier Questions Panel - STEP 21 */}
      <div className="mt-6">
        <SupplierQuestionsPanel 
          rfpId={rfp.id}
          rfpTimeline={{
            askQuestionsStart: rfp.askQuestionsStart ? rfp.askQuestionsStart.toISOString() : null,
            askQuestionsEnd: rfp.askQuestionsEnd ? rfp.askQuestionsEnd.toISOString() : null
          }}
        />
      </div>

      {/* RFP Timeline Bar - STEP 14 */}
      <div className="mt-6">
        <RFPTimelineBar rfp={rfp} />
      </div>

      {/* RFP Timeline Details - STEP 14 */}
      <div className="mt-6">
        <RFPTimelineDetails rfp={rfp} />
      </div>

      {/* Opportunity Score Panel - STEP 13 */}
      <div className="mt-6">
        <OpportunityScorePanel
          rfpId={rfp.id}
          score={rfp.opportunityScore}
          breakdown={rfp.opportunityScoreBreakdown as any}
          source={rfp.opportunityScoreSource as 'AUTO' | 'MANUAL' | null}
          updatedAt={rfp.opportunityScoreUpdatedAt}
          overrideReason={rfp.opportunityScoreOverrideReason}
        />
      </div>

      {/* AI Executive Summary Section */}
      <div className="mt-6">
        <AISummary rfpId={rfp.id} rfpTitle={rfp.title} />
      </div>

      {/* Summary Sharing History Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Summary Sharing History</h2>
        </div>
        
        {rfp.summaryShares.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No summaries shared yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Share the AI summary to start tracking
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Recipient Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Template
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Sent Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rfp.summaryShares.map((share) => (
                  <tr key={share.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium">
                          {share.contact?.name || 'External Contact'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{share.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        {share.template}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(share.sentAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stage Tasks Section */}
      <div className="mt-6">
        <StageTasks rfpId={rfp.id} stage={rfp.stage} initialTasks={stageTasks} />
      </div>

      {/* AI Actions Panel */}
      <div className="mt-6">
        <AIActionsPanel
          rfpId={rfp.id}
          stage={rfp.stage}
          actions={STAGE_AI_ACTIONS[rfp.stage] || []}
        />
      </div>

      {/* Stage SLA Monitor Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Stage SLA Monitor
        </h2>
        
        <div className="space-y-4">
          {(() => {
            const slaStatus = getSlaStatus(rfp);
            
            return (
              <>
                {/* Current Stage */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Current Stage:</span>
                  <span className="text-sm text-gray-900">{STAGE_LABELS[rfp.stage]}</span>
                </div>
                
                {/* Days in Stage */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Days in Stage:</span>
                  <span className="text-sm text-gray-900">{slaStatus.daysInStage} days</span>
                </div>
                
                {/* Allowed SLA Days */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Allowed SLA:</span>
                  <span className="text-sm text-gray-900">
                    {slaStatus.sla !== null ? `${slaStatus.sla} days` : 'No SLA'}
                  </span>
                </div>
                
                {/* Status Chip */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      slaStatus.status === 'ok'
                        ? 'bg-green-100 text-green-700'
                        : slaStatus.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {slaStatus.status === 'ok' && '✓ OK'}
                    {slaStatus.status === 'warning' && '⚠ Warning'}
                    {slaStatus.status === 'breached' && '✕ Breached'}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Stage Automation Log Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Stage Automation Log
        </h2>
        
        {automationLog.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No automation actions for this stage yet.
          </p>
        ) : (
          <div className="space-y-3">
            {automationLog.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Automation:</span> Created task — {task.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stage Timeline Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Stage Timeline
        </h2>
        
        {rfp.stageHistory.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Stage changes will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {rfp.stageHistory.map((history) => {
              const oldLabel = history.oldStage ? STAGE_LABELS[history.oldStage] : 'None';
              const newLabel = STAGE_LABELS[history.newStage];
              const user = history.changedBy ? userMap[history.changedBy] : null;
              const userName = user?.name || user?.email || 'Unknown';
              
              return (
                <div
                  key={history.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-600" />
                  
                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Stage changed: <span className="font-medium">{oldLabel}</span> → <span className="font-medium">{newLabel}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(history.createdAt).toLocaleString()}
                      {history.changedBy && ` by ${userName}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
