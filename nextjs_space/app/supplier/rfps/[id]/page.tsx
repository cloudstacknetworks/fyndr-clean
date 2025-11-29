import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { Calendar, Building2, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { STAGE_LABELS } from '@/lib/stages';
import { formatTimelineDate, getTimelineMilestones, getStatusColor } from '@/lib/rfp-timeline';

const prisma = new PrismaClient();

async function getSupplierRFPAccess(rfpId: string, userId: string) {
  // Check if this user has access to this RFP via SupplierContact
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: userId,
    },
    include: {
      rfp: {
        include: {
          company: true,
          supplier: true,
        },
      },
    },
  });

  return supplierContact;
}

export default async function SupplierRFPPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const rfpId = params.id;

  // Verify access
  const supplierAccess = await getSupplierRFPAccess(rfpId, session.user.id);

  if (!supplierAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            You don't have permission to view this RFP.
          </p>
        </div>
      </div>
    );
  }

  const rfp = supplierAccess.rfp;
  const milestones = getTimelineMilestones(rfp);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {rfp.title}
            </h1>
            <p className="text-gray-600">
              Invited by <span className="font-semibold">{rfp.company.name}</span>
            </p>
          </div>
          <div className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
            Read-Only Access
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">
              Supplier Portal — Part 1 (Read-Only View)
            </h3>
            <p className="text-indigo-700 text-sm">
              This is a read-only view of the RFP details. Future updates will include response submission capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* RFP Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">RFP Details</h2>
        
        <div className="space-y-4">
          {/* Description */}
          {rfp.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{rfp.description}</p>
            </div>
          )}

          {/* Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Stage</h3>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {STAGE_LABELS[rfp.stage] || rfp.stage}
                </span>
              </div>
            </div>

            {rfp.priority && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Priority</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    rfp.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                    rfp.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {rfp.priority}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Budget */}
          {rfp.budget && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Budget
              </h3>
              <p className="text-gray-900 text-lg font-semibold">
                ${rfp.budget.toLocaleString()}
              </p>
            </div>
          )}

          {/* Due Date */}
          {rfp.dueDate && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Due Date
              </h3>
              <p className="text-gray-900">
                {new Date(rfp.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Buyer Organization */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              Buyer Organization
            </h3>
            <p className="text-gray-900 font-medium">{rfp.company.name}</p>
            {rfp.company.description && (
              <p className="text-gray-600 text-sm mt-1">{rfp.company.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline & Milestones */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Timeline & Important Dates
          </h2>
          
          <div className="space-y-3">
            {milestones.map((milestone, index) => {
              const statusColor = getStatusColor(milestone.status);
              
              return (
                <div
                  key={index}
                  className={`border-l-4 pl-4 py-2 ${statusColor.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{milestone.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {milestone.start && milestone.end
                          ? `${formatTimelineDate(milestone.start)} - ${formatTimelineDate(milestone.end)}`
                          : milestone.start
                          ? formatTimelineDate(milestone.start)
                          : milestone.end
                          ? formatTimelineDate(milestone.end)
                          : 'Not specified'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}>
                        {milestone.status === 'future' && '⚪ Upcoming'}
                        {milestone.status === 'active' && '🔵 Active'}
                        {milestone.status === 'overdue' && '🔴 Overdue'}
                        {milestone.status === 'completed' && '🟢 Completed'}
                      </span>
                      {milestone.daysRemaining !== null && milestone.daysRemaining !== undefined && (
                        <span className="text-xs text-gray-500">
                          {milestone.daysRemaining > 0
                            ? `${milestone.daysRemaining} days remaining`
                            : `${Math.abs(milestone.daysRemaining)} days overdue`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Need Help?</h2>
        <p className="text-gray-700 mb-4">
          If you have any questions about this RFP or need clarification on any requirements, 
          please contact the buyer organization directly.
        </p>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Buyer Organization:</span> {rfp.company.name}
          </p>
        </div>
      </div>
    </div>
  );
}
