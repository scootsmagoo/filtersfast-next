'use client';

import { Heart } from 'lucide-react';

interface DonationSummaryProps {
  charityName: string;
  amount: number;
  className?: string;
}

export default function DonationSummary({ charityName, amount, className = '' }: DonationSummaryProps) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-green-900 mb-1">
            Thank you for your donation!
          </h4>
          <p className="text-sm text-green-800">
            Your ${amount.toFixed(2)} donation to <span className="font-medium">{charityName}</span> will make a real difference.
          </p>
        </div>
      </div>
    </div>
  );
}

