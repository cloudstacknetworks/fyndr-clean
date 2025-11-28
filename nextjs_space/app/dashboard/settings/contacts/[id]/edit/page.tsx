import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import EditContactForm from './edit-contact-form';

async function getContact(contactId: string, userId: string) {
  return await prisma.contact.findFirst({
    where: {
      id: contactId,
      userId
    }
  });
}

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const contact = await getContact(params.id, session.user.id);

  if (!contact) {
    redirect('/dashboard/settings/contacts');
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/settings/contacts/${contact.id}`}
          className="text-indigo-600 hover:text-indigo-900 inline-block"
        >
          ← Back to Contact Details
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Contact</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <EditContactForm contact={contact} />
      </div>
    </div>
  );
}
