/**
 * Mock Reminders Database
 * 
 * In production, this would be replaced with actual database queries
 */

import { 
  Reminder, 
  ReminderPreferences, 
  ReminderStats, 
  CreateReminderInput,
  UpdateReminderInput,
  FREQUENCY_TO_MONTHS,
  FILTER_LIFESPANS,
  ScheduledReminder
} from '@/lib/types/reminder';

// Mock storage (in-memory)
let mockReminders: Reminder[] = [];
let mockPreferences: Map<string, ReminderPreferences> = new Map();
let nextReminderId = 1;

/**
 * Calculate next reminder date based on frequency
 */
export function calculateNextReminderDate(
  lastPurchaseDate: Date,
  frequency: string,
  customMonths?: number
): Date {
  const months = frequency === 'custom' && customMonths 
    ? customMonths 
    : FREQUENCY_TO_MONTHS[frequency as keyof typeof FREQUENCY_TO_MONTHS] || 3;
  
  const nextDate = new Date(lastPurchaseDate);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

/**
 * Get default preferences for a customer
 */
function getDefaultPreferences(customerId: string, email: string): ReminderPreferences {
  return {
    customerId,
    enableReminders: true,
    defaultNotificationMethod: 'email',
    defaultFrequency: 'quarterly',
    daysBeforeReplacement: 7,
    quietHoursEnabled: false,
    emailAddress: email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get customer preferences
 */
export async function getCustomerPreferences(customerId: string, email: string): Promise<ReminderPreferences> {
  if (!mockPreferences.has(customerId)) {
    const defaults = getDefaultPreferences(customerId, email);
    mockPreferences.set(customerId, defaults);
    return defaults;
  }
  return mockPreferences.get(customerId)!;
}

/**
 * Update customer preferences
 */
export async function updateCustomerPreferences(
  customerId: string,
  updates: Partial<ReminderPreferences>
): Promise<ReminderPreferences> {
  const current = mockPreferences.get(customerId) || getDefaultPreferences(customerId, updates.emailAddress || '');
  
  const updated: ReminderPreferences = {
    ...current,
    ...updates,
    updatedAt: new Date(),
  };
  
  mockPreferences.set(customerId, updated);
  return updated;
}

/**
 * Create a new reminder
 */
export async function createReminder(
  customerId: string,
  customerEmail: string,
  customerName: string,
  productId: string,
  productName: string,
  productSku: string,
  productImage: string,
  filterType: string,
  input: CreateReminderInput
): Promise<Reminder> {
  const now = new Date();
  const lastPurchaseDate = now; // In production, get from actual order
  
  const reminder: Reminder = {
    id: `reminder-${nextReminderId++}`,
    customerId,
    customerEmail,
    customerName,
    productId,
    productName,
    productSku,
    productImage,
    filterType: filterType as any,
    frequency: input.frequency,
    customMonths: input.customMonths,
    notificationMethod: input.notificationMethod,
    lastPurchaseDate,
    nextReminderDate: calculateNextReminderDate(lastPurchaseDate, input.frequency, input.customMonths),
    status: 'active',
    remindersSent: 0,
    reordersFromReminders: 0,
    createdAt: now,
    updatedAt: now,
    notes: input.notes,
  };
  
  mockReminders.push(reminder);
  return reminder;
}

/**
 * Get all reminders for a customer
 */
export async function getCustomerReminders(customerId: string): Promise<Reminder[]> {
  return mockReminders
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get reminder by ID
 */
export async function getReminderById(id: string): Promise<Reminder | null> {
  return mockReminders.find(r => r.id === id) || null;
}

/**
 * Update a reminder
 */
export async function updateReminder(
  id: string,
  updates: UpdateReminderInput
): Promise<Reminder | null> {
  const index = mockReminders.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  const reminder = mockReminders[index];
  const updated: Reminder = {
    ...reminder,
    ...updates,
    updatedAt: new Date(),
  };
  
  // Recalculate next reminder date if frequency changed
  if (updates.frequency || updates.customMonths) {
    updated.nextReminderDate = calculateNextReminderDate(
      new Date(updated.lastPurchaseDate),
      updated.frequency,
      updated.customMonths
    );
  }
  
  mockReminders[index] = updated;
  return updated;
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: string): Promise<boolean> {
  const index = mockReminders.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  mockReminders.splice(index, 1);
  return true;
}

/**
 * Pause a reminder
 */
export async function pauseReminder(id: string): Promise<Reminder | null> {
  return updateReminder(id, { status: 'paused' });
}

/**
 * Resume a reminder
 */
export async function resumeReminder(id: string): Promise<Reminder | null> {
  return updateReminder(id, { status: 'active' });
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(id: string): Promise<Reminder | null> {
  const reminder = await getReminderById(id);
  if (!reminder) return null;
  
  const now = new Date();
  return updateReminder(id, {
    ...reminder,
    lastReminderSent: now,
    remindersSent: reminder.remindersSent + 1,
    // Calculate next reminder date
    nextReminderDate: calculateNextReminderDate(
      now,
      reminder.frequency,
      reminder.customMonths
    ),
  } as any);
}

/**
 * Track reorder from reminder
 */
export async function trackReminderReorder(id: string): Promise<Reminder | null> {
  const reminder = await getReminderById(id);
  if (!reminder) return null;
  
  // TODO: Implement reorder tracking in database
  // For now, just return the reminder
  return reminder;
}

/**
 * Get reminders due for sending
 */
export async function getDueReminders(): Promise<Reminder[]> {
  const now = new Date();
  
  return mockReminders.filter(r => {
    if (r.status !== 'active') return false;
    
    const nextDate = new Date(r.nextReminderDate);
    return nextDate <= now;
  });
}

/**
 * Get upcoming reminders (next 30 days)
 */
export async function getUpcomingReminders(days: number = 30): Promise<Reminder[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return mockReminders.filter(r => {
    if (r.status !== 'active') return false;
    
    const nextDate = new Date(r.nextReminderDate);
    return nextDate > now && nextDate <= futureDate;
  }).sort((a, b) => 
    new Date(a.nextReminderDate).getTime() - new Date(b.nextReminderDate).getTime()
  );
}

/**
 * Get reminder statistics for a customer
 */
export async function getCustomerReminderStats(customerId: string): Promise<ReminderStats> {
  const reminders = mockReminders.filter(r => r.customerId === customerId);
  
  const totalReminders = reminders.length;
  const activeReminders = reminders.filter(r => r.status === 'active').length;
  const pausedReminders = reminders.filter(r => r.status === 'paused').length;
  
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const remindersSentThisMonth = reminders.reduce((sum, r) => {
    if (!r.lastReminderSent) return sum;
    const sentDate = new Date(r.lastReminderSent);
    return sentDate >= firstOfMonth ? sum + 1 : sum;
  }, 0);
  
  const totalSent = reminders.reduce((sum, r) => sum + r.remindersSent, 0);
  const reordersFromReminders = reminders.reduce((sum, r) => sum + r.reordersFromReminders, 0);
  const conversionRate = totalSent > 0 ? (reordersFromReminders / totalSent) * 100 : 0;
  
  return {
    totalReminders,
    activeReminders,
    pausedReminders,
    remindersSentThisMonth,
    reordersFromReminders,
    conversionRate,
  };
}

/**
 * Get all reminders (admin function)
 */
export async function getAllReminders(): Promise<Reminder[]> {
  return [...mockReminders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get scheduled reminders for display
 */
export async function getScheduledReminders(limit: number = 50): Promise<ScheduledReminder[]> {
  const upcoming = await getUpcomingReminders(90);
  
  return upcoming.slice(0, limit).map(r => ({
    reminderId: r.id,
    scheduledFor: r.nextReminderDate,
    productName: r.productName,
    customerEmail: r.customerEmail,
    status: 'pending' as const,
  }));
}

