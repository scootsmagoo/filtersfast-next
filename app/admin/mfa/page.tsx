import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
;
import MFADashboard from '@/components/admin/MFADashboard';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export const metadata = {
  title: 'MFA Dashboard - Admin - FiltersFast',
  description: 'Monitor two-factor authentication adoption and security',
};

export default async function AdminMFAPage() {
  // Check authentication
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user) {
    redirect('/sign-in?redirect=/admin/mfa');
  }

  // Admin authorization is handled by the layout

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminBreadcrumb />
        <MFADashboard />
      </div>
    </div>
  );
}

