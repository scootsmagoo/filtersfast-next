import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import MFADashboard from '@/components/admin/MFADashboard';

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

  // Check admin access using email whitelist
  if (!hasAdminAccess(session.user)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="container mx-auto px-4">
        <MFADashboard />

        {/* Navigation */}
        <div className="mt-8 text-center space-x-4">
          <a
            href="/admin"
            className="text-brand-orange hover:text-orange-600 font-medium"
          >
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

