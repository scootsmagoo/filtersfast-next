'use client';

import { Partner } from '@/lib/types/partner';
import ContentBlockRenderer from './ContentBlockRenderer';
import { ExternalLink } from 'lucide-react';

interface PartnerPageContentProps {
  partner: Partner;
}

export default function PartnerPageContent({ partner }: PartnerPageContentProps) {
  // Auto-apply discount code for corporate partners
  if (partner.discountCode && typeof window !== 'undefined') {
    // Store discount code in session/local storage for checkout
    sessionStorage.setItem('partnerDiscountCode', partner.discountCode);
  }

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#partner-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-brand-orange focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange focus:font-medium"
      >
        Skip to main content
      </a>
      
      <div className="min-h-screen">
        {/* Content Blocks */}
        <div id="partner-content" className="partner-content" role="main">
          {partner.contentBlocks
            .sort((a, b) => a.order - b.order)
            .map((block) => (
              <ContentBlockRenderer key={block.id} block={block} partner={partner} />
            ))}
        </div>

      {/* Fallback content if no content blocks */}
      {partner.contentBlocks.length === 0 && (
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto">
            {/* Logo */}
            {partner.logo && (
              <div className="text-center mb-8">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-24 mx-auto object-contain"
                />
              </div>
            )}

            {/* Hero Image */}
            {partner.heroImage && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={partner.heroImage}
                  alt={partner.name}
                  className="w-full h-96 object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              {partner.name}
            </h1>

            {/* Short Description */}
            {partner.shortDescription && (
              <p className="text-xl text-gray-600 mb-6 text-center">
                {partner.shortDescription}
              </p>
            )}

            {/* Mission Statement */}
            {partner.missionStatement && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Mission</h2>
                <p className="text-gray-700 italic">{partner.missionStatement}</p>
              </div>
            )}

            {/* Full Description */}
            {partner.description && (
              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed">{partner.description}</p>
              </div>
            )}

            {/* Discount Notice */}
            {partner.discountCode && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-green-900 mb-2 text-center">
                  Exclusive Discount
                </h2>
                <p className="text-green-800 text-center mb-4">
                  {partner.discountDescription || 'Special discount for partner customers'}
                </p>
                <div className="text-center">
                  <code className="px-4 py-2 bg-green-100 text-green-900 rounded font-mono text-lg font-bold">
                    {partner.discountCode}
                  </code>
                </div>
                <p className="text-sm text-green-700 text-center mt-4">
                  Your discount will be automatically applied at checkout
                </p>
              </div>
            )}

            {/* Partnership Date */}
            {partner.partnershipStartDate && (
              <p className="text-gray-600 text-center mb-6">
                Partners since {new Date(partner.partnershipStartDate).getFullYear()}
              </p>
            )}

            {/* Website Link */}
            {partner.websiteUrl && (
              <div className="text-center">
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
                  aria-label={`Visit ${partner.name} website (opens in new tab)`}
                >
                  Visit {partner.name}
                  <ExternalLink className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

