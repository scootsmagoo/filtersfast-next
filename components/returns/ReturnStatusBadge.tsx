/**
 * Return Status Badge Component
 * Visual indicator for return status
 */

import { ReturnStatus } from '@/lib/types/returns';

interface ReturnStatusBadgeProps {
  status: ReturnStatus;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ReturnStatusBadge({ 
  status, 
  showText = true,
  size = 'md' 
}: ReturnStatusBadgeProps) {
  const getStatusConfig = (status: ReturnStatus) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Pending Review',
          icon: '⏳'
        };
      case 'approved':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Approved',
          icon: '✓'
        };
      case 'label_sent':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Label Sent',
          icon: '📧'
        };
      case 'in_transit':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'In Transit',
          icon: '🚚'
        };
      case 'received':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'Received',
          icon: '📦'
        };
      case 'inspecting':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'Inspecting',
          icon: '🔍'
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Completed',
          icon: '✓'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Rejected',
          icon: '✗'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Cancelled',
          icon: '✗'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: status,
          icon: ''
        };
    }
  };

  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${config.color} ${sizeClasses[size]}`}
    >
      {config.icon && <span>{config.icon}</span>}
      {showText && <span>{config.text}</span>}
    </span>
  );
}

