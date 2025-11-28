import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import SettingsClient from './settings-client';

const prisma = new PrismaClient();

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
  return user;
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect('/login');
  }

  const user = await getUserData(session.user.id);

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>

      <SettingsClient user={user} />
    </div>
  );
}
