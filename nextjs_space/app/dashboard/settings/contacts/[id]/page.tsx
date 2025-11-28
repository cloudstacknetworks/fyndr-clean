import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { User, Mail, Briefcase, Share2, FileText, Calendar, Edit } from 'lucide-react';
import DeleteContactButton from '../delete-contact-button';

async function getContact(contactId: string, userId: string) {
  return await prisma.contact.findFirst({
    where: {
      id: contactId,
      userId
    },
    include: {
      shares: {
        include: {
          rfp: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { sentAt: 'desc' }
      }
    }
  });
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const contact = await getContact(params.id, session.user.id);

  if (!contact) {
    redirect('/dashboard/settings/contacts');
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/settings/contacts"
          className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block"
        >
          ← Back to Contacts
        </Link>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{contact.name}</h1>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{contact.email}</span>
              </div>
              {contact.role && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{contact.role}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/settings/contacts/${contact.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <DeleteContactButton contactId={contact.id} contactName={contact.name} />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Share2 className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{contact.shares.length}</p>
                <p className="text-sm text-gray-600">Total Shares</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Share History</h2>
        
        {contact.shares.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No summaries shared with this contact yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFP Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contact.shares.map((share) => (
                  <tr key={share.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/rfps/${share.rfp.id}`}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-900"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{share.rfp.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {share.template}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(share.sentAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/rfps/${share.rfp.id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        View RFP
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
