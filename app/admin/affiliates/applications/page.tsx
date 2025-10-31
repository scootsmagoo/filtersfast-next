'use client';

/**
 * Admin Affiliate Applications Page
 * 
 * Review and process pending affiliate applications
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { AffiliateApplication } from '@/lib/types/affiliate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Globe,
  Users,
  TrendingUp,
  Mail
} from 'lucide-react';

interface ApplicationWithUser extends AffiliateApplication {
  user_name: string;
  user_email: string;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [customCommissionRate, setCustomCommissionRate] = useState<number | ''>('');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/affiliates/applications');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchApplications();
    }
  }, [session]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm('Are you sure you want to approve this affiliate application?')) {
      return;
    }

    setProcessingId(applicationId);

    try {
      const response = await fetch('/api/admin/affiliates/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          action: 'approve',
          custom_commission_rate: customCommissionRate || undefined
        }),
      });

      if (response.ok) {
        await fetchApplications();
        alert('Application approved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    } finally {
      setProcessingId(null);
      setCustomCommissionRate('');
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    setProcessingId(applicationId);

    try {
      const response = await fetch('/api/admin/affiliates/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          action: 'reject',
          rejection_reason: rejectReason
        }),
      });

      if (response.ok) {
        await fetchApplications();
        setRejectingId(null);
        setRejectReason('');
        alert('Application rejected');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4" role="status" aria-live="polite">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span className="sr-only">Loading applications...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 id="main-content" className="text-3xl font-bold mb-2 flex items-center gap-3" tabIndex={-1}>
                <Clock className="w-8 h-8 text-yellow-600" aria-hidden="true" />
                Pending Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Review and process affiliate applications
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/affiliates')}
              aria-label="Go back to affiliates page"
            >
              Back to Affiliates
            </Button>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              There are no pending affiliate applications at this time.
            </p>
          </Card>
        ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <Card key={app.id} className="p-6">
              {/* Application Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {app.company_name || 'Individual Affiliate'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {app.user_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {app.user_email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                    Pending Review
                  </span>
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Website
                  </h4>
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {app.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Promotional Methods</h4>
                  <div className="flex flex-wrap gap-2">
                    {app.promotional_methods.map((method) => (
                      <span
                        key={method}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {method.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {app.audience_size && (
                  <div>
                    <h4 className="font-semibold mb-2">Audience Size</h4>
                    <p className="text-gray-700 dark:text-gray-300">{app.audience_size.replace('_', ' ')}</p>
                  </div>
                )}

                {app.monthly_traffic && (
                  <div>
                    <h4 className="font-semibold mb-2">Monthly Traffic</h4>
                    <p className="text-gray-700 dark:text-gray-300">{app.monthly_traffic}</p>
                  </div>
                )}
              </div>

              {/* Social Media Links */}
              {app.social_media_links && app.social_media_links.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Social Media</h4>
                  <div className="space-y-1">
                    {app.social_media_links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {link}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion Plan */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Promotion Plan
                </h4>
                <Card className="bg-gray-50 dark:bg-gray-800 p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {app.promotion_plan}
                  </p>
                </Card>
              </div>

              {/* Custom Commission Rate Input */}
              <div className="mb-6">
                <label htmlFor={`commission-${app.id}`} className="block font-semibold mb-2">
                  Custom Commission Rate (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`commission-${app.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={customCommissionRate}
                    onChange={(e) => setCustomCommissionRate(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="Leave empty for default rate"
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                    aria-describedby={`commission-help-${app.id}`}
                  />
                  <span className="text-gray-600 dark:text-gray-400" aria-hidden="true">%</span>
                  <span id={`commission-help-${app.id}`} className="text-sm text-gray-500 dark:text-gray-400">
                    (Leave blank to use default program rate)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t dark:border-gray-700" role="group" aria-label="Application actions">
                {rejectingId === app.id ? (
                  <div className="flex-1 space-y-3">
                    <label htmlFor={`reject-reason-${app.id}`} className="sr-only">
                      Rejection reason
                    </label>
                    <textarea
                      id={`reject-reason-${app.id}`}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 h-24"
                      aria-required="true"
                      minLength={10}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        disabled={processingId === app.id}
                        aria-label="Cancel rejection"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleReject(app.id)}
                        disabled={processingId === app.id || !rejectReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                        aria-label="Confirm rejection of application"
                      >
                        <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                        {processingId === app.id ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => setRejectingId(app.id)}
                      variant="outline"
                      disabled={processingId === app.id}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Reject application from ${app.company_name || app.user_name}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleApprove(app.id)}
                      disabled={processingId === app.id}
                      className="flex-1"
                      aria-label={`Approve application from ${app.company_name || app.user_name}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                      {processingId === app.id ? 'Approving...' : 'Approve Application'}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

