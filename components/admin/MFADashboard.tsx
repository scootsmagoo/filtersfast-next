'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Key, Smartphone, AlertCircle, TrendingUp, Activity } from 'lucide-react';

interface MFAStats {
  totalUsers: number;
  usersWithMFA: number;
  mfaAdoptionRate: number;
  totalBackupCodes: number;
  usedBackupCodes: number;
  totalTrustedDevices: number;
  recentSetups: number;
  failedAttemptsLast24h: number;
  successfulLoginsLast24h: number;
}

export default function MFADashboard() {
  const [stats, setStats] = useState<MFAStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/mfa/stats');
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load statistics');
      }

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent" role="status">
          <span className="sr-only">Loading MFA statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Statistics</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MFA Dashboard</h1>
          <p className="text-gray-600">Monitor two-factor authentication adoption and security</p>
        </div>
      </div>

      {/* Adoption Rate Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-green-900">MFA Adoption Rate</h2>
            <p className="text-sm text-green-700">Percentage of users with MFA enabled</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600" aria-hidden="true" />
        </div>
        <div className="flex items-end gap-4">
          <div className="text-5xl font-bold text-green-900">
            {stats.mfaAdoptionRate.toFixed(1)}%
          </div>
          <div className="text-gray-700 mb-2">
            <span className="font-semibold">{stats.usersWithMFA}</span> of {stats.totalUsers} users
          </div>
        </div>
        {stats.mfaAdoptionRate < 50 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Tip:</strong> Consider encouraging more users to enable MFA through email campaigns or account security reminders.
            </p>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users with MFA */}
        <StatsCard
          title="Users with MFA"
          value={stats.usersWithMFA}
          subtitle={`Out of ${stats.totalUsers} total users`}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
        />

        {/* Recent Setups */}
        <StatsCard
          title="Recent Setups"
          value={stats.recentSetups}
          subtitle="MFA enabled in last 30 days"
          icon={<Shield className="w-6 h-6 text-purple-600" />}
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
        />

        {/* Successful Logins */}
        <StatsCard
          title="Successful Logins"
          value={stats.successfulLoginsLast24h}
          subtitle="MFA logins in last 24 hours"
          icon={<Activity className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
          borderColor="border-green-200"
        />

        {/* Failed Attempts */}
        <StatsCard
          title="Failed Attempts"
          value={stats.failedAttemptsLast24h}
          subtitle="Failed verifications (24h)"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          bgColor="bg-red-50"
          borderColor="border-red-200"
          warning={stats.failedAttemptsLast24h > 10}
        />

        {/* Backup Codes */}
        <StatsCard
          title="Backup Codes"
          value={`${stats.totalBackupCodes - stats.usedBackupCodes} / ${stats.totalBackupCodes}`}
          subtitle="Available / Total codes"
          icon={<Key className="w-6 h-6 text-orange-600" />}
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
        />

        {/* Trusted Devices */}
        <StatsCard
          title="Trusted Devices"
          value={stats.totalTrustedDevices}
          subtitle="Active trusted devices"
          icon={<Smartphone className="w-6 h-6 text-indigo-600" />}
          bgColor="bg-indigo-50"
          borderColor="border-indigo-200"
        />
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Security Recommendations</h3>
        <div className="space-y-3">
          {stats.mfaAdoptionRate < 25 && (
            <RecommendationItem
              type="warning"
              text="MFA adoption is below 25%. Consider making it mandatory for admin accounts."
            />
          )}
          {stats.failedAttemptsLast24h > 20 && (
            <RecommendationItem
              type="alert"
              text={`High number of failed MFA attempts (${stats.failedAttemptsLast24h}) detected. Review security logs.`}
            />
          )}
          {stats.totalTrustedDevices > stats.usersWithMFA * 2 && (
            <RecommendationItem
              type="info"
              text="Many trusted devices detected. Users may be over-trusting devices."
            />
          )}
          {stats.mfaAdoptionRate >= 75 && (
            <RecommendationItem
              type="success"
              text="Excellent MFA adoption rate! Your users are security-conscious."
            />
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadStats}
          className="px-6 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          Refresh Statistics
        </button>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  warning?: boolean;
}

function StatsCard({ title, value, subtitle, icon, bgColor, borderColor, warning }: StatsCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-6`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-sm text-gray-600">{subtitle}</p>
      {warning && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          Requires attention
        </div>
      )}
    </div>
  );
}

// Recommendation Item Component
interface RecommendationItemProps {
  type: 'success' | 'info' | 'warning' | 'alert';
  text: string;
}

function RecommendationItem({ type, text }: RecommendationItemProps) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    alert: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    success: <Activity className="w-5 h-5" aria-hidden="true" />,
    info: <Shield className="w-5 h-5" aria-hidden="true" />,
    warning: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
    alert: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
  };

  return (
    <div className={`p-4 border rounded-lg flex items-start gap-3 ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm flex-1">{text}</p>
    </div>
  );
}

