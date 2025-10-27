/**
 * TrackingTimeline Component
 * 
 * Visual timeline showing order status progression
 */

import { CheckCircle, Clock, Package, Truck, Home } from 'lucide-react';

interface TimelineEvent {
  status: string;
  date: string;
  completed: boolean;
  description?: string;
}

interface TrackingTimelineProps {
  events: TimelineEvent[];
}

export default function TrackingTimeline({ events }: TrackingTimelineProps) {
  const getIcon = (status: string, completed: boolean) => {
    const iconClass = `w-5 h-5 ${completed ? 'text-white' : 'text-gray-400'}`;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('placed') || statusLower.includes('received')) {
      return <CheckCircle className={iconClass} />;
    }
    if (statusLower.includes('processing') || statusLower.includes('preparing')) {
      return <Package className={iconClass} />;
    }
    if (statusLower.includes('shipped') || statusLower.includes('transit')) {
      return <Truck className={iconClass} />;
    }
    if (statusLower.includes('delivery') && !statusLower.includes('delivered')) {
      return <Home className={iconClass} />;
    }
    if (statusLower.includes('delivered')) {
      return <CheckCircle className={iconClass} />;
    }
    return <Clock className={iconClass} />;
  };

  return (
    <div className="relative">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4 pb-8 last:pb-0">
          {/* Icon Column */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              event.completed ? 'bg-green-600' : 'bg-gray-300'
            }`}>
              {getIcon(event.status, event.completed)}
            </div>
            {index < events.length - 1 && (
              <div className={`w-0.5 h-full mt-2 ${
                event.completed ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
          
          {/* Content Column */}
          <div className="flex-1 pt-1">
            <h3 className={`font-semibold text-lg ${
              event.completed ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {event.status}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {event.description && (
              <p className="text-sm text-gray-600 mt-2">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

