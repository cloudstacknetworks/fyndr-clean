import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Download, MessageSquare, FileText, HelpCircle, Activity } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SupplierTimelineBar from "../../components/supplier-timeline-bar";
import SubmissionProgressTracker from "../../components/submission-progress-tracker";

async function getRFPOverview(rfpId: string, userId: string) {
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: userId,
    }
  });

  if (!supplierContact) return null;

  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      company: true,
      supplier: true,
      supplierBroadcastMessages: { orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  const response = await prisma.supplierResponse.findUnique({
    where: { supplierContactId: supplierContact.id },
    include: {
      attachments: true
    }
  });

  return {
    supplierContact,
    rfp,
    response
  };
}

export default async function SupplierRFPOverviewPage({
  params
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "supplier") {
    redirect("/login");
  }

  const data = await getRFPOverview(params.id, session.user.id);
  if (!data || !data.rfp) {
    return <div className="p-6">RFP not found or access denied.</div>;
  }

  const { supplierContact, rfp, response } = data;
  const now = new Date();
  const qaOpen = rfp.askQuestionsStart && rfp.askQuestionsEnd && 
                 rfp.askQuestionsStart <= now && rfp.askQuestionsEnd >= now;
  const submissionOpen = rfp.submissionStart && rfp.submissionEnd &&
                         rfp.submissionStart <= now && rfp.submissionEnd >= now;

  return (
    <div className="p-6 space-y-6" data-demo-section="supplier-rfp-overview">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{rfp.title}</h1>
            <p className="text-gray-600 mt-1">{rfp.company.name}</p>
            {rfp.description && (
              <p className="text-gray-700 mt-3">{rfp.description}</p>
            )}
          </div>
          <OptionUpgradeIcon />
        </div>
      </div>

      {/* Timeline */}
      <SupplierTimelineBar
        inviteDate={supplierContact.createdAt}
        qaWindowStart={rfp.askQuestionsStart}
        qaWindowEnd={rfp.askQuestionsEnd}
        submissionWindowStart={rfp.submissionStart}
        submissionWindowEnd={rfp.submissionEnd}
        demoWindowStart={rfp.demoWindowStart}
        demoWindowEnd={rfp.demoWindowEnd}
        awardDate={rfp.awardDate}
      />

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Tracker */}
        <SubmissionProgressTracker
          structuredData={response?.structuredAnswers}
          attachments={response?.attachments}
          submittedAt={response?.submittedAt}
        />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {submissionOpen && !response?.submittedAt && (
              <Link
                href={`/supplier/rfps/${params.id}`}
                className="flex items-center justify-between p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100"
                data-demo-action="start-response"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">
                    {response?.structuredAnswers ? "Continue Response" : "Start Response"}
                  </span>
                </div>
                <span className="text-indigo-600">→</span>
              </Link>
            )}

            {qaOpen && (
              <Link
                href={`/supplier/rfps/${params.id}/questions`}
                className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100"
                data-demo-action="ask-question"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Ask a Question</span>
                </div>
                <span className="text-green-600">→</span>
              </Link>
            )}

            <Link
              href={`/supplier/rfps/${params.id}/activity`}
              className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100"
              data-demo-action="view-activity"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">View Activity</span>
              </div>
              <span className="text-gray-600">→</span>
            </Link>

            <button 
              className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 w-full"
              data-demo-action="download-documents"
            >
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Download Documents</span>
              </div>
              <span className="text-gray-600">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Buyer Messages */}
      {rfp.supplierBroadcastMessages && rfp.supplierBroadcastMessages.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6" data-demo-section="buyer-messages">
          <h3 className="text-lg font-semibold mb-4">Buyer Messages</h3>
          <div className="space-y-3">
            {rfp.supplierBroadcastMessages.map((broadcast: any) => (
              <div key={broadcast.id} className="border-l-4 border-indigo-600 pl-4 py-2">
                <div className="text-sm text-gray-600">{broadcast.message}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(broadcast.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Sidebar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" data-demo-element="help-sidebar">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review the RFP requirements carefully</li>
              <li>• Ask questions before the Q&A window closes</li>
              <li>• Submit your response before the deadline</li>
              <li>• Check buyer messages regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionUpgradeIcon() {
  return (
    <button
      className="p-2 text-gray-400 hover:text-gray-600"
      title="Additional features available in Option 3"
      data-demo-trigger="option-upgrade"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
