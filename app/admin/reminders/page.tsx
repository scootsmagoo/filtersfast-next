'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Reminder } from '@/lib/types/reminder';
import Card from '@/components/ui/Card';
import { Bell, Calendar, Users, TrendingUp, Mail } from 'lucide-react';

export default function AdminRemindersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Protect admin route
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/reminders');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchReminders();
    }
  }, [session]);

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReminders = reminders.length;
  const activeReminders = reminders.filter(r => r.status === 'active').length;
  const totalSent = reminders.reduce((sum, r) => sum + r.remindersSent, 0);
  const totalReorders = reminders.reduce((sum, r) => sum + r.reordersFromReminders, 0);
  const conversionRate = totalSent > 0 ? ((totalReorders / totalSent) * 100).toFixed(1) : '0';

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-pulse space-y-4" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading reminder management...</span>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
      >
        Skip to main content
      </a>

      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="mb-8">
          <h1 id="main-content" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
            <Bell className="w-8 h-8 text-brand-orange" aria-hidden="true" />
            Reminder Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Monitor and manage customer filter replacement reminders
          </p>
        </div>

        {/* Summary Stats */}
        <section aria-label="Reminder statistics" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Reminders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-label={`${totalReminders} total reminders`}>
                  {totalReminders}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors" aria-hidden="true">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-colors" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-label={`${activeReminders} active reminders`}>
                  {activeReminders}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center transition-colors" aria-hidden="true">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 transition-colors" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Reminders Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-label={`${totalSent} reminders sent`}>
                  {totalSent}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center transition-colors" aria-hidden="true">
                <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400 transition-colors" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-label={`${conversionRate} percent conversion rate`}>
                  {conversionRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center transition-colors" aria-hidden="true">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400 transition-colors" />
              </div>
            </div>
          </Card>
        </section>

        {/* Recent Reminders */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">Recent Reminders</h2>
          
          {reminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors" aria-hidden="true" />
              <p className="text-gray-600 dark:text-gray-400 transition-colors">No reminders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Customer filter reminders">
                <caption className="sr-only">
                  List of customer filter replacement reminders with status and scheduling information
                </caption>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 transition-colors">
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">Customer</th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">Product</th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">Frequency</th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">Next Date</th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">Sent</th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.slice(0, 20).map((reminder) => (
                    <tr key={reminder.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{reminder.customerName}</p>
                          <p className="text-gray-600 dark:text-gray-400 transition-colors">{reminder.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 transition-colors">{reminder.productName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 capitalize transition-colors">{reminder.frequency}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                        {new Date(reminder.nextReminderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 transition-colors">{reminder.remindersSent}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            reminder.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : reminder.status === 'paused'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {reminder.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

