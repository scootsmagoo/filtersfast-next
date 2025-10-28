'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Reminder, ReminderStats } from '@/lib/types/reminder';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, Plus, Pause, Play, Trash2, Calendar, Package, TrendingUp, CheckCircle } from 'lucide-react';

export default function RemindersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/account/reminders');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [remindersRes, statsRes] = await Promise.all([
        fetch('/api/reminders'),
        fetch('/api/reminders/stats')
      ]);

      if (remindersRes.ok) {
        const data = await remindersRes.json();
        setReminders(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      const response = await fetch(`/api/reminders/${id}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchData();
      } else {
        setError('Failed to pause reminder. Please try again.');
      }
    } catch (error) {
      console.error('Error pausing reminder:', error);
      setError('Failed to pause reminder. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      const response = await fetch(`/api/reminders/${id}/resume`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchData();
      } else {
        setError('Failed to resume reminder. Please try again.');
      }
    } catch (error) {
      console.error('Error resuming reminder:', error);
      setError('Failed to resume reminder. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setActionLoading(deleteConfirm);
    setError('');
    try {
      const response = await fetch(`/api/reminders/${deleteConfirm}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        setDeleteConfirm(null);
      } else {
        setError('Failed to delete reminder. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setError('Failed to delete reminder. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFrequencyLabel = (reminder: Reminder) => {
    if (reminder.frequency === 'custom' && reminder.customMonths) {
      return `Every ${reminder.customMonths} month${reminder.customMonths > 1 ? 's' : ''}`;
    }
    const labels = {
      monthly: 'Every month',
      quarterly: 'Every 3 months',
      biannual: 'Every 6 months',
      annual: 'Every year',
    };
    return labels[reminder.frequency as keyof typeof labels] || reminder.frequency;
  };

  if (isPending || loading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse space-y-4" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading reminders...</span>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              Filter Replacement Reminders
            </h1>
            <p className="text-gray-600">
              Never forget to replace your filters. We'll remind you when it's time.
            </p>
          </div>
          <Button
            onClick={() => router.push('/account/reminders/new')}
            className="flex items-center gap-2"
            aria-label="Create new reminder"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            New Reminder
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <section aria-label="Reminder statistics" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Reminders</p>
                <p className="text-2xl font-bold text-gray-900" aria-label={`${stats.activeReminders} active reminders`}>
                  {stats.activeReminders}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reorders This Year</p>
                <p className="text-2xl font-bold text-gray-900" aria-label={`${stats.reordersFromReminders} reorders from reminders`}>
                  {stats.reordersFromReminders}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900" aria-label={`${stats.conversionRate.toFixed(0)} percent conversion rate`}>
                  {stats.conversionRate.toFixed(0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Reminders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first reminder to never miss a filter replacement
            </p>
            <Button onClick={() => router.push('/account/reminders/new')}>
              <Plus className="w-5 h-5 mr-2" />
              Create Reminder
            </Button>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className="p-6">
              <div className="flex items-start gap-6">
                {/* Product Image */}
                {reminder.productImage && (
                  <img
                    src={reminder.productImage}
                    alt={reminder.productName}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {reminder.productName}
                      </h3>
                      <p className="text-sm text-gray-600">{reminder.productSku}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        reminder.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : reminder.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      role="status"
                      aria-label={`Reminder status: ${reminder.status}`}
                    >
                      {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>Next: {formatDate(reminder.nextReminderDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Bell className="w-4 h-4" aria-hidden="true" />
                      <span>{getFrequencyLabel(reminder)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{reminder.remindersSent}</span> reminders sent
                    </div>
                  </div>

                  {reminder.notes && (
                    <p className="text-sm text-gray-600 mb-4">{reminder.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {reminder.status === 'active' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePause(reminder.id)}
                        disabled={actionLoading === reminder.id}
                        className="flex items-center gap-2"
                        aria-label={`Pause reminder for ${reminder.productName}`}
                        aria-busy={actionLoading === reminder.id}
                      >
                        <Pause className="w-4 h-4" aria-hidden="true" />
                        {actionLoading === reminder.id ? 'Pausing...' : 'Pause'}
                      </Button>
                    ) : reminder.status === 'paused' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResume(reminder.id)}
                        disabled={actionLoading === reminder.id}
                        className="flex items-center gap-2"
                        aria-label={`Resume reminder for ${reminder.productName}`}
                        aria-busy={actionLoading === reminder.id}
                      >
                        <Play className="w-4 h-4" aria-hidden="true" />
                        {actionLoading === reminder.id ? 'Resuming...' : 'Resume'}
                      </Button>
                    ) : null}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/account/reminders/${reminder.id}`)}
                      className="flex items-center gap-2"
                      aria-label={`Edit reminder for ${reminder.productName}`}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteClick(reminder.id)}
                      disabled={actionLoading === reminder.id}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      aria-label={`Delete reminder for ${reminder.productName}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDeleteCancel();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleDeleteCancel();
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 id="delete-dialog-title" className="text-xl font-bold text-gray-900 mb-4">
              Delete Reminder?
            </h2>
            <p id="delete-dialog-description" className="text-gray-600 mb-6">
              Are you sure you want to delete this reminder? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={handleDeleteCancel}
                disabled={actionLoading === deleteConfirm}
                aria-label="Cancel deletion"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={actionLoading === deleteConfirm}
                className="bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-busy={actionLoading === deleteConfirm}
                aria-label="Confirm deletion"
              >
                {actionLoading === deleteConfirm ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

