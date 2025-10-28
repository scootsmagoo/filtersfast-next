/**
 * Filter Replacement Reminder Types
 * 
 * Helps customers remember when to replace their filters
 */

export type ReminderFrequency = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'custom';
export type ReminderStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type NotificationMethod = 'email' | 'sms' | 'both';

export interface FilterLifespan {
  filterType: 'air' | 'water' | 'refrigerator' | 'pool' | 'humidifier';
  defaultMonths: number;
  minMonths: number;
  maxMonths: number;
}

export interface Reminder {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  
  // Product information
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  filterType: 'air' | 'water' | 'refrigerator' | 'pool' | 'humidifier';
  
  // Reminder settings
  frequency: ReminderFrequency;
  customMonths?: number; // For custom frequency
  notificationMethod: NotificationMethod;
  
  // Scheduling
  lastPurchaseDate: Date | string;
  nextReminderDate: Date | string;
  lastReminderSent?: Date | string;
  
  // Status
  status: ReminderStatus;
  
  // Tracking
  remindersSent: number;
  reordersFromReminders: number;
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Optional notes
  notes?: string;
}

export interface ReminderPreferences {
  customerId: string;
  
  // Global settings
  enableReminders: boolean;
  defaultNotificationMethod: NotificationMethod;
  defaultFrequency: ReminderFrequency;
  
  // Notification timing
  daysBeforeReplacement: number; // Send reminder X days before
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  
  // Contact preferences
  emailAddress: string;
  phoneNumber?: string;
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReminderStats {
  totalReminders: number;
  activeReminders: number;
  pausedReminders: number;
  remindersSentThisMonth: number;
  reordersFromReminders: number;
  conversionRate: number; // reorders / remindersSent
}

export interface ScheduledReminder {
  reminderId: string;
  scheduledFor: Date | string;
  productName: string;
  customerEmail: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface ReminderEmail {
  to: string;
  subject: string;
  productName: string;
  productImage: string;
  reorderLink: string;
  manageRemindersLink: string;
}

// Form data
export interface CreateReminderInput {
  productId: string;
  frequency: ReminderFrequency;
  customMonths?: number;
  notificationMethod: NotificationMethod;
  notes?: string;
}

export interface UpdateReminderInput {
  frequency?: ReminderFrequency;
  customMonths?: number;
  notificationMethod?: NotificationMethod;
  status?: ReminderStatus;
  notes?: string;
}

// Filter lifespan defaults
export const FILTER_LIFESPANS: Record<string, FilterLifespan> = {
  air: {
    filterType: 'air',
    defaultMonths: 3,
    minMonths: 1,
    maxMonths: 12,
  },
  water: {
    filterType: 'water',
    defaultMonths: 6,
    minMonths: 3,
    maxMonths: 12,
  },
  refrigerator: {
    filterType: 'refrigerator',
    defaultMonths: 6,
    minMonths: 3,
    maxMonths: 12,
  },
  pool: {
    filterType: 'pool',
    defaultMonths: 12,
    minMonths: 6,
    maxMonths: 24,
  },
  humidifier: {
    filterType: 'humidifier',
    defaultMonths: 6,
    minMonths: 3,
    maxMonths: 12,
  },
};

// Frequency to months mapping
export const FREQUENCY_TO_MONTHS: Record<ReminderFrequency, number | null> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
  custom: null, // Uses customMonths
};

