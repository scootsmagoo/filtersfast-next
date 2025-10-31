'use client';

import { useState, useEffect } from 'react';
import { Partner, PartnerType } from '@/lib/types/partner';
import Card from '@/components/ui/Card';
import { Handshake, Heart, Building2, Ticket, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PartnerType | 'all'>('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = filter === 'all' 
    ? partners 
    : partners.filter(p => p.type === filter);

  const charityPartners = partners.filter(p => p.type === 'charity');
  const corporatePartners = partners.filter(p => p.type === 'corporate');
  const discountPrograms = partners.filter(p => p.type === 'discount_program');

  const getPartnerIcon = (type: PartnerType) => {
    switch (type) {
      case 'charity': return <Heart className="w-6 h-6" />;
      case 'corporate': return <Building2 className="w-6 h-6" />;
      case 'discount_program': return <Ticket className="w-6 h-6" />;
    }
  };

  const getPartnerTypeLabel = (type: PartnerType) => {
    switch (type) {
      case 'charity': return 'Charity Partner';
      case 'corporate': return 'Corporate Partner';
      case 'discount_program': return 'Discount Program';
    }
  };

  const getPartnerTypeBadge = (type: PartnerType) => {
    switch (type) {
      case 'charity': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'corporate': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'discount_program': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3 transition-colors"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-brand-orange focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange focus:font-medium"
      >
        Skip to main content
      </a>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-orange to-orange-600 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <Handshake className="w-16 h-16 mx-auto mb-4" aria-hidden="true" />
              <h1 id="main-content" className="text-4xl md:text-5xl font-bold mb-4" tabIndex={-1}>
                Our Partners
              </h1>
              <p className="text-xl text-white/90">
                Together, we're making a difference through meaningful partnerships
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm transition-colors">
          <div className="container-custom">
            <div 
              className="flex gap-2 overflow-x-auto py-4" 
              role="tablist" 
              aria-label="Partner type filters"
            >
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                role="tab"
                aria-selected={filter === 'all'}
                aria-label="Show all partners"
              >
                All Partners ({partners.length})
              </button>
              <button
                onClick={() => setFilter('charity')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'charity'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                role="tab"
                aria-selected={filter === 'charity'}
                aria-label={`Show charity partners (${charityPartners.length})`}
              >
                <Heart className="w-4 h-4 inline mr-2" aria-hidden="true" />
                Charity Partners ({charityPartners.length})
              </button>
              <button
                onClick={() => setFilter('corporate')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'corporate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                role="tab"
                aria-selected={filter === 'corporate'}
                aria-label={`Show corporate partners (${corporatePartners.length})`}
              >
                <Building2 className="w-4 h-4 inline mr-2" aria-hidden="true" />
                Corporate Partners ({corporatePartners.length})
              </button>
              <button
                onClick={() => setFilter('discount_program')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'discount_program'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                role="tab"
                aria-selected={filter === 'discount_program'}
                aria-label={`Show discount programs (${discountPrograms.length})`}
              >
                <Ticket className="w-4 h-4 inline mr-2" aria-hidden="true" />
                Discount Programs ({discountPrograms.length})
              </button>
            </div>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="container-custom py-12">
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="region"
            aria-label="Partner listings"
          >
            {filteredPartners.map((partner) => (
              <Card key={partner.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
                {/* Partner Image */}
                {partner.heroImage && (
                  <div className="h-48 overflow-hidden flex-shrink-0">
                    <img
                      src={partner.heroImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  {/* Logo */}
                  {partner.logo && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="h-16 object-contain"
                      />
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getPartnerTypeBadge(partner.type)}`}>
                      {getPartnerIcon(partner.type)}
                      {getPartnerTypeLabel(partner.type)}
                    </span>
                  </div>

                  {/* Name & Description */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                    {partner.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 transition-colors">
                    {partner.shortDescription}
                  </p>

                  {/* Partnership Date */}
                  {partner.partnershipStartDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors">
                      Partners since {new Date(partner.partnershipStartDate).getFullYear()}
                    </p>
                  )}

                  {/* Discount Badge */}
                  {partner.discountCode && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 mb-4 transition-colors">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300 transition-colors">
                        ✨ {partner.discountDescription || 'Exclusive discount available'}
                      </p>
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-grow"></div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto pt-4">
                    <Link
                      href={`/partners/${partner.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
                      aria-label={`Learn more about ${partner.name}`}
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                        aria-label={`Visit ${partner.name} website (opens in new tab)`}
                        title="Visit partner website"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Visit website</span>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredPartners.length === 0 && (
            <div className="text-center py-16">
              <Handshake className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                No Partners Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                {filter === 'all' 
                  ? 'There are currently no active partners.'
                  : `There are no ${getPartnerTypeLabel(filter as PartnerType).toLowerCase()}s at this time.`}
              </p>
            </div>
          )}
        </div>

        {/* Featured Section */}
        {partners.some(p => p.featured) && (
          <div className="bg-white dark:bg-gray-800 py-16 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Featured Partnership
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
                  Learn about our flagship partnerships making a real difference
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {partners
                  .filter(p => p.featured)
                  .map((partner) => (
                    <Link
                      key={partner.id}
                      href={`/partners/${partner.slug}`}
                      className="group block"
                    >
                      <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-orange focus-within:ring-offset-2">
                        {partner.heroImage && (
                          <div className="h-64 overflow-hidden">
                            <img
                              src={partner.heroImage}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          {partner.logo && (
                            <img
                              src={partner.logo}
                              alt={partner.name}
                              className="h-20 object-contain mb-4"
                            />
                          )}
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-brand-orange transition-colors">
                            {partner.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors">
                            {partner.description || partner.shortDescription}
                          </p>
                          <div className="flex items-center gap-2 text-brand-orange font-medium">
                            Learn more about our partnership
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

