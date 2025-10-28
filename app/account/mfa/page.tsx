import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import MFASettings from '@/components/mfa/MFASettings';

export const metadata = {
  title: 'Two-Factor Authentication - FiltersFast',
  description: 'Manage your two-factor authentication settings',
};

export default async function MFAPage() {
  // Check authentication
  const session = await auth.api.getSession({ headers: headers() });
  
  if (!session?.user) {
    redirect('/sign-in?redirect=/account/mfa');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Security Settings
          </h1>
          <p className="text-gray-600">
            Manage your two-factor authentication and security preferences
          </p>
        </div>

        {/* MFA Settings Component */}
        <MFASettings />

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/account/settings"
            className="text-brand-orange hover:text-orange-600 font-medium"
          >
            ← Back to Account Settings
          </a>
        </div>
      </div>
    </div>
  );
}

