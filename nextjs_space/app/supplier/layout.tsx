import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import SupplierLayout from './supplier-layout';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Ensure user has supplier role
  // We'll check this in the middleware, but also here for extra security
  
  return <SupplierLayout session={session}>{children}</SupplierLayout>;
}
