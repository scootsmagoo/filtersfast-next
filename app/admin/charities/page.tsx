'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Charity, CharityStats } from '@/lib/types/charity';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Heart, TrendingUp, DollarSign, Users, Calendar, ExternalLink } from 'lucide-react';

export default function AdminCharitiesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);

  // Protect admin route
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/charities');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchCharities();
    }
  }, [session]);

  const fetchCharities = async () => {
    try {
      const response = await fetch('/api/charities');
      if (response.ok) {
        const data = await response.json();
        setCharities(data);
      }
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDonations = charities.reduce((sum, c) => sum + c.totalDonations, 0);
  const totalDonationCount = charities.reduce((sum, c) => sum + c.donationCount, 0);

  // Show loading during auth check
  if (isPending || loading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse space-y-4" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading charity management...</span>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
      >
        Skip to main content
      </a>
      
      <div className="container-custom py-12">
        <div className="mb-8">
          <h1 id="main-content" className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" aria-hidden="true" />
            Charity Management
          </h1>
          <p className="text-gray-600">
            Manage charitable organizations and track donation impact
          </p>
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalDonations.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Contributions</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalDonationCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Charities</p>
              <p className="text-2xl font-bold text-gray-900">
                {charities.filter(c => c.active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charities List */}
      <div className="space-y-6">
        {charities.map((charity) => (
          <Card key={charity.id} className="p-6">
            <div className="flex items-start gap-6">
              {/* Logo */}
              {charity.logo && (
                <img
                  src={charity.logo}
                  alt={charity.name}
                  className="w-32 h-24 object-contain rounded-lg bg-white border border-gray-200 p-2"
                />
              )}

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {charity.name}
                      </h3>
                      {charity.featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Featured
                        </span>
                      )}
                      {charity.active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {charity.shortDescription}
                    </p>
                    {charity.website && (
                      <a
                        href={charity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Visit website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Total Raised</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${charity.totalDonations.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Donations</p>
                    <p className="text-lg font-bold text-gray-900">
                      {charity.donationCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Avg. Donation</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${charity.donationCount > 0 
                        ? (charity.totalDonations / charity.donationCount).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                </div>

                {/* Campaign Period */}
                {(charity.startDate || charity.endDate) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Campaign Period:</span>
                      {charity.startDate && (
                        <span>
                          {new Date(charity.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {charity.startDate && charity.endDate && <span>-</span>}
                      {charity.endDate && (
                        <span>
                          {new Date(charity.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Donation Settings */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {charity.allowRoundUp && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Round-up enabled
                    </span>
                  )}
                  {charity.allowCustomAmount && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Custom amounts
                    </span>
                  )}
                  {charity.suggestedAmounts.length > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Suggested: ${charity.suggestedAmounts.join(', $')}
                    </span>
                  )}
                </div>

                {/* Description */}
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                    Full Description
                  </summary>
                  <p className="pl-4">{charity.description}</p>
                </details>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {charities.length === 0 && (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Charities Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Add your first charity to start collecting donations
          </p>
          <Button>Add Charity</Button>
        </Card>
      )}
      </div>
    </>
  );
}

