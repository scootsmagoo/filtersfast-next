'use client';

import clsx from 'clsx';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'sent'
  | 'cancelled';

const STATUS_CONFIG: Record<
  CampaignStatus,
  {
    label: string;
    className: string;
  }
> = {
  draft: {
    label: 'Draft',
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border border-gray-300 dark:border-gray-700',
  },
  scheduled: {
    label: 'Scheduled',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60',
  },
  sending: {
    label: 'Sending',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
  },
  paused: {
    label: 'Paused',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
  },
  sent: {
    label: 'Sent',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200/60 dark:border-green-800/60',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200/60 dark:border-red-800/60',
  },
};

export interface CampaignStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: CampaignStatus | string;
}

export default function CampaignStatusBadge({
  status,
  className,
  ...props
}: CampaignStatusBadgeProps) {
  const normalized = (status as CampaignStatus)?.toLowerCase?.() as CampaignStatus;
  const config = STATUS_CONFIG[normalized];

  if (!config) {
    return (
      <span
        className={clsx(
          'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide',
          'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
          className
        )}
        {...props}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
        config.className,
        className
      )}
      {...props}
    >
      {config.label}
    </span>
  );
}


