import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  CheckCircle,
  FileText,
  AlertCircle,
  FileSpreadsheet,
  Presentation,
  Video,
  File,
  Download,
} from 'lucide-react';
import AIInsightsPanel from './ai-insights-panel';
import ReadinessPanel from './readiness-panel';

const prisma = new PrismaClient();

async function getResponseData(rfpId: string, supplierContactId: string, userId: string) {
  // Verify RFP ownership
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    select: {
      id: true,
      title: true,
      userId: true,
    },
  });

  if (!rfp || rfp.userId !== userId) {
    return null;
  }

  // Fetch supplier contact and response
  const supplierContact = await prisma.supplierContact.findUnique({
    where: { id: supplierContactId },
    include: {
      supplierResponse: {
        include: {
          attachments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!supplierContact || supplierContact.rfpId !== rfpId) {
    return null;
  }

  return {
    rfp,
    supplierContact,
  };
}

const structuredFieldLabels = {
  executiveSummary: 'Executive Summary',
  solutionOverview: 'Solution Overview',
  technicalApproach: 'Technical Approach',
  pricingOverview: 'Pricing Overview',
  implementationTimeline: 'Implementation Timeline Summary',
  keyDifferentiators: 'Key Differentiators',
  assumptions: 'Assumptions & Dependencies',
  risks: 'Risks & Mitigations',
  demoLink: 'Demo / Presentation Link',
};

const getAttachmentIcon = (attachmentType: string) => {
  switch (attachmentType) {
    case 'PRICING_SHEET':
    case 'REQUIREMENTS_MATRIX':
      return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    case 'PRESENTATION':
      return <Presentation className="w-6 h-6 text-orange-600" />;
    case 'DEMO_RECORDING':
      return <Video className="w-6 h-6 text-purple-600" />;
    default:
      return <File className="w-6 h-6 text-gray-600" />;
  }
};

const getAttachmentTypeLabel = (attachmentType: string) => {
  const labels: Record<string, string> = {
    GENERAL: 'General',
    PRICING_SHEET: 'Pricing Sheet',
    REQUIREMENTS_MATRIX: 'Requirements Matrix',
    PRESENTATION: 'Presentation',
    DEMO_RECORDING: 'Demo Recording',
    CONTRACT_DRAFT: 'Contract Draft',
    OTHER: 'Other',
  };
  return labels[attachmentType] || attachmentType;
};

export default async function BuyerResponseDetailPage({
  params,
}: {
  params: { id: string; supplierContactId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const data = await getResponseData(params.id, params.supplierContactId, session.user.id);

  if (!data) {
    notFound();
  }

  const { rfp, supplierContact } = data;
  const response = supplierContact.supplierResponse;
  const hasResponse = !!response && response.status !== 'DRAFT';
  const structuredAnswers = (response?.structuredAnswers as Record<string, string>) || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Navigation */}
      <Link
        href={`/dashboard/rfps/${rfp.id}`}
        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to RFP
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{rfp.title}</h1>
            <h2 className="text-xl text-gray-700 font-semibold">
              Supplier Response: {supplierContact.name}
            </h2>
          </div>
          {response && (
            <div>
              {response.status === 'SUBMITTED' ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submitted on {new Date(response.submittedAt!).toLocaleDateString()}
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Draft – not submitted
                </span>
              )}
            </div>
          )}
        </div>

        {/* Supplier Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{supplierContact.email}</p>
            </div>
          </div>
          {supplierContact.organization && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Organization</p>
                <p className="text-sm font-medium text-gray-900">{supplierContact.organization}</p>
              </div>
            </div>
          )}
          {supplierContact.invitedAt && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Invited</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(supplierContact.invitedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No Response State */}
      {!response && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-900 mb-2">
            No Response Yet
          </h3>
          <p className="text-amber-700">
            This supplier has not started a response yet.
          </p>
        </div>
      )}

      {/* Draft State Warning */}
      {response && response.status === 'DRAFT' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Draft Response</p>
            <p className="text-sm text-blue-800 mt-1">
              This response is still in draft status and has not been formally submitted by the supplier.
            </p>
          </div>
        </div>
      )}

      {/* Structured Answers */}
      {response && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Structured Response</h3>
          
          <div className="space-y-6">
            {Object.entries(structuredFieldLabels).map(([key, label]) => {
              const value = structuredAnswers[key];
              
              // Special handling for demoLink
              if (key === 'demoLink') {
                return (
                  <div key={key}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{label}</h4>
                    {value ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 hover:underline break-all"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-gray-400 italic">Not provided</p>
                    )}
                  </div>
                );
              }
              
              return (
                <div key={key}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{label}</h4>
                  {value ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{value}</p>
                  ) : (
                    <p className="text-gray-400 italic">Not provided</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachments */}
      {response && response.attachments && response.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Attachments ({response.attachments.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {response.attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getAttachmentIcon(attachment.attachmentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {getAttachmentTypeLabel(attachment.attachmentType)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded {new Date(attachment.createdAt).toLocaleDateString()}
                    </p>
                    {attachment.description && (
                      <p className="text-xs text-gray-600 mt-2">{attachment.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    href={`/api/attachments/${attachment.id}/download`}
                    download
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Notes */}
      {response && response.notesFromSupplier && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Message from Supplier</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-900 whitespace-pre-wrap">{response.notesFromSupplier}</p>
          </div>
        </div>
      )}

      {/* No Attachments Message */}
      {response && (!response.attachments || response.attachments.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Attachments</h3>
          <p className="text-center text-gray-500 py-8">No attachments provided</p>
        </div>
      )}

      {/* AI-Extracted Insights Panel */}
      {response && response.status === 'SUBMITTED' && (
        <AIInsightsPanel
          responseId={response.id}
          extractedData={{
            extractedPricing: response.extractedPricing as any,
            extractedRequirementsCoverage: response.extractedRequirementsCoverage as any,
            extractedTechnicalClaims: response.extractedTechnicalClaims as any,
            extractedAssumptions: response.extractedAssumptions as any,
            extractedRisks: response.extractedRisks as any,
            extractedDifferentiators: response.extractedDifferentiators as any,
            extractedDemoSummary: response.extractedDemoSummary as any,
            extractedFilesMetadata: response.extractedFilesMetadata as any,
          }}
        />
      )}

      {/* Supplier Readiness Panel (STEP 20) */}
      {response && response.status === 'SUBMITTED' && (
        <ReadinessPanel
          responseId={response.id}
          readinessData={{
            complianceFindings: response.complianceFindings as any,
            diversityMetadata: response.diversityMetadata as any,
            mandatoryRequirementsStatus: response.mandatoryRequirementsStatus as any,
            riskFlags: response.riskFlags as any,
            readinessIndicator: response.readinessIndicator as any,
            readinessRationale: response.readinessRationale as any,
          }}
        />
      )}
    </div>
  );
}
