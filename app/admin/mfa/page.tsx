import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Database from 'better-sqlite3';
import MFADashboard from '@/components/admin/MFADashboard';

const dbPath = process.env.DATABASE_URL || "./auth.db";

export const metadata = {
  title: 'MFA Dashboard - Admin - FiltersFast',
  description: 'Monitor two-factor authentication adoption and security',
};

export default async function AdminMFAPage() {
  // Check authentication
  const session = await auth.api.getSession({ headers: headers() });
  
  if (!session?.user) {
    redirect('/sign-in?redirect=/admin/mfa');
  }

  // Check admin role
  const db = new Database(dbPath);
  const user = db.prepare('SELECT * FROM user WHERE email = ?').get(session.user.email!) as any;
  db.close();

  if (!user || user.role !== 'admin') {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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

