'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function ReviewsPage() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const loadAttemptedRef = useRef(false);

  const loadTrustpilotWidget = () => {
    if (typeof window !== 'undefined' && (window as any).Trustpilot && widgetRef.current) {
      try {
        (window as any).Trustpilot.loadFromElement(widgetRef.current, true);
        return true;
      } catch (error) {
        console.error('Error loading Trustpilot widget:', error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    // Prevent multiple load attempts
    if (loadAttemptedRef.current) return;
    
    let retryCount = 0;
    const maxRetries = 20; // Try for up to 4 seconds (20 * 200ms)
    let timeoutId: NodeJS.Timeout | null = null;
    
    const tryLoadWidget = () => {
      const loaded = loadTrustpilotWidget();
      
      if (loaded) {
        loadAttemptedRef.current = true;
        return;
      }
      
      // If not loaded yet and haven't exceeded max retries, try again
      if (retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(tryLoadWidget, 200);
      }
    };
    
    // Start trying to load the widget
    tryLoadWidget();
    
    // Cleanup function - prevent memory leaks
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      loadAttemptedRef.current = false;
    };
  }, []);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    loadTrustpilotWidget();
  };
  return (
    <>
      {/* Load TrustPilot Bootstrap Script */}
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />

      <div className="container-custom py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-gray-900 dark:text-white mb-4">
              <span className="text-brand-orange">FiltersFast</span> Customer Reviews
            </h1>
            <p className="text-lg text-brand-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Don&apos;t just take our word for it. See what thousands of satisfied customers have to say about their FiltersFast experience.
            </p>
          </div>

          {/* TrustPilot Widget */}
          <section 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
            aria-label="Customer reviews from Trustpilot"
          >
            <div
              ref={widgetRef}
              className="trustpilot-widget"
              data-locale="en-US"
              data-template-id="539adbd6dec7e10e686debee"
              data-businessunit-id="47783f490000640005020cf6"
              data-style-height="500px"
              data-style-width="100%"
              data-stars="1,2,3,4,5"
              data-review-languages="en"
              role="complementary"
              aria-label="Trustpilot customer reviews widget"
            >
              {/* Fallback content while widget loads */}
              <div 
                className="flex items-center justify-center min-h-[500px]"
                role="status"
                aria-live="polite"
                aria-label="Loading customer reviews"
              >
                <div className="text-center">
                  <div 
                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"
                    aria-hidden="true"
                  ></div>
                  <p className="text-brand-gray-600 dark:text-gray-300">Loading reviews...</p>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Information */}
          <section 
            className="bg-brand-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center"
            aria-labelledby="why-choose-heading"
          >
            <h2 id="why-choose-heading" className="text-2xl font-bold text-brand-gray-900 dark:text-white mb-4">
              Why Choose <span className="text-brand-orange">FiltersFast</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8" role="list">
              <div className="space-y-2" role="listitem">
                <p className="text-4xl font-bold text-brand-orange" aria-label="88,000 plus verified reviews">
                  <span aria-hidden="true">88,000+</span>
                </p>
                <p className="text-brand-gray-700 dark:text-gray-300 font-semibold">Verified Reviews</p>
                <p className="text-sm text-brand-gray-600 dark:text-gray-400">
                  Real customers, real experiences
                </p>
              </div>
              <div className="space-y-2" role="listitem">
                <p className="text-4xl font-bold text-brand-orange" aria-label="4.2 out of 5 average rating">
                  <span aria-hidden="true">4.2/5</span>
                </p>
                <p className="text-brand-gray-700 dark:text-gray-300 font-semibold">Average Rating</p>
                <p className="text-sm text-brand-gray-600 dark:text-gray-400">
                  Consistently high satisfaction
                </p>
              </div>
              <div className="space-y-2" role="listitem">
                <p className="text-4xl font-bold text-brand-orange" aria-label="20 plus years in business">
                  <span aria-hidden="true">20+ Years</span>
                </p>
                <p className="text-brand-gray-700 dark:text-gray-300 font-semibold">In Business</p>
                <p className="text-sm text-brand-gray-600 dark:text-gray-400">
                  Trusted filtration experts since 2005
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section 
            className="mt-12 text-center"
            aria-labelledby="cta-heading"
          >
            <h3 id="cta-heading" className="text-2xl font-bold text-brand-gray-900 dark:text-white mb-4">
              Ready to Experience <span className="text-brand-orange">FiltersFast</span>?
            </h3>
            <p className="text-brand-gray-600 dark:text-gray-300 mb-6">
              Join thousands of satisfied customers who trust us for their filtration needs.
            </p>
            <nav aria-label="Primary call-to-action" className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-orange text-white font-semibold hover:bg-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 transition-colors"
                aria-label="Shop our complete filter catalog"
              >
                Shop Filters
              </a>
              <a
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-gray-800 text-brand-gray-900 dark:text-white font-semibold border-2 border-brand-gray-300 dark:border-gray-700 hover:border-brand-orange dark:hover:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 transition-colors"
                aria-label="Contact our customer support team"
              >
                Contact Support
              </a>
            </nav>
          </section>
        </div>
      </div>
    </>
  );
}

