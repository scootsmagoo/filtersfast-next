/**
 * Admin ID.me Verification Dashboard
 * 
 * View and manage ID.me verifications
 * Admin only
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Shield, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';

export const metadata = {
  title: 'ID.me Verifications | Admin',
  description: 'Manage ID.me military and first responder verifications',
};

async function getStats() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/idme/stats`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

export default async function AdminIdMePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Check if user is admin
  if (!session?.user || session.user.email !== 'adam@example.com') {
    redirect('/');
  }

  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ID.me Verifications</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage military and first responder verifications
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Active</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.totalActive}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last 30 Days</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.recentVerifications}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Shield className="w-6 h-6 text-purple-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Military</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.byType.military || 0}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-orange-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* By Type Breakdown */}
        {stats && Object.keys(stats.byType).length > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Verifications by Type
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(stats.byType).map(([type, count]: [string, any]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize mt-1">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configuration
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="font-medium">Military Discount:</span>
                <span>10%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="font-medium">First Responder Discount:</span>
                <span>10%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="font-medium">Employee Discount:</span>
                <span>15%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium">Max Discount Amount:</span>
                <span>$100</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

