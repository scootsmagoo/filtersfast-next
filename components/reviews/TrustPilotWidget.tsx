/**
 * TrustPilot Widget Component
 * Embeds official TrustPilot TrustBox widgets
 * 
 * Widget Templates:
 * - Mini: 53aa8807dec7e10d38f59f32
 * - Micro: 5419b6a8b0d04a076446a9ad
 * - Carousel: 53aa8912dec7e10d38f59f36
 * - Grid: 539adbd6dec7e10e686debee
 * - List: 539ad0ffdec7e10e686debd7
 * - Starter: 56278e9abfbbba0bdcd568bc
 */

'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface TrustPilotWidgetProps {
  templateId?: string;
  businessUnitId?: string;
  theme?: 'light' | 'dark';
  stars?: '1' | '2' | '3' | '4' | '5';
  sku?: string; // For product-specific reviews
  locale?: string;
  height?: string;
  width?: string;
  tags?: string; // e.g., "SelectedReview"
  className?: string;
}

const DEFAULT_BUSINESS_UNIT_ID = '47783f490000640005020cf6';

export default function TrustPilotWidget({
  templateId = '53aa8912dec7e10d38f59f36', // Carousel by default
  businessUnitId = DEFAULT_BUSINESS_UNIT_ID,
  theme = 'light',
  stars,
  sku,
  locale = 'en-US',
  height = '140px',
  width = '100%',
  tags,
  className = '',
}: TrustPilotWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reload TrustPilot widgets when component mounts or props change
    if (typeof window !== 'undefined' && (window as any).Trustpilot) {
      (window as any).Trustpilot.loadFromElement(widgetRef.current, true);
    }
  }, [templateId, businessUnitId, stars, sku, theme]);

  return (
    <>
      {/* TrustPilot Bootstrap Script */}
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
      />

      {/* TrustBox Widget */}
      <div
        ref={widgetRef}
        className={`trustpilot-widget ${className}`}
        data-locale={locale}
        data-template-id={templateId}
        data-businessunit-id={businessUnitId}
        data-style-height={height}
        data-style-width={width}
        data-theme={theme}
        {...(stars && { 'data-stars': stars })}
        {...(sku && { 'data-sku': sku })}
        {...(tags && { 'data-tags': tags })}
      >
        {/* Fallback content */}
        <a
          href={`https://www.trustpilot.com/review/www.filtersfast.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-orange hover:underline"
        >
          View our Trustpilot reviews
        </a>
      </div>
    </>
  );
}

// Pre-configured widget variants for common use cases

export function TrustPilotMiniWidget({ sku, className }: { sku?: string; className?: string }) {
  return (
    <TrustPilotWidget
      templateId="53aa8807dec7e10d38f59f32"
      sku={sku}
      height="20px"
      width="100%"
      className={className}
    />
  );
}

export function TrustPilotMicroWidget({ sku, className }: { sku?: string; className?: string }) {
  return (
    <TrustPilotWidget
      templateId="5419b6a8b0d04a076446a9ad"
      sku={sku}
      height="24px"
      width="100%"
      className={className}
    />
  );
}

export function TrustPilotCarouselWidget({ 
  sku, 
  height = '240px',
  className 
}: { 
  sku?: string; 
  height?: string;
  className?: string;
}) {
  return (
    <TrustPilotWidget
      templateId="53aa8912dec7e10d38f59f36"
      sku={sku}
      height={height}
      width="100%"
      className={className}
    />
  );
}

export function TrustPilotGridWidget({ 
  sku, 
  height = '500px',
  className 
}: { 
  sku?: string; 
  height?: string;
  className?: string;
}) {
  return (
    <TrustPilotWidget
      templateId="539adbd6dec7e10e686debee"
      sku={sku}
      height={height}
      width="100%"
      className={className}
    />
  );
}

export function TrustPilotListWidget({ 
  sku, 
  height = '400px',
  stars,
  className 
}: { 
  sku?: string; 
  height?: string;
  stars?: '1' | '2' | '3' | '4' | '5';
  className?: string;
}) {
  return (
    <TrustPilotWidget
      templateId="539ad0ffdec7e10e686debd7"
      sku={sku}
      height={height}
      width="100%"
      stars={stars}
      className={className}
    />
  );
}

