import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import NewContactForm from './new-contact-form';

export default async function NewContactPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Contact</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <NewContactForm />
      </div>
    </div>
  );
}
