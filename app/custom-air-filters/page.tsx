'use client';

import CustomFilterBuilder from '@/components/custom-filters/CustomFilterBuilder';

export default function CustomAirFiltersPage() {
  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Custom Filter Builder Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-b-2 border-green-200 dark:border-gray-600 py-12 transition-colors">
        <div className="container-custom">
          <CustomFilterBuilder />
        </div>
      </section>

      {/* SEO Content Section */}
      <div className="bg-white border-t">
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
              Custom Air Filters - Any Size, Made to Order
            </h2>
            <p className="text-brand-gray-700 mb-6">
              Need a filter that's not a standard size? No problem! Our custom air filter builder lets you 
              create filters to your exact specifications. Whether you have an unusual HVAC system, a vintage unit, 
              or simply need a non-standard dimension, we can manufacture the perfect filter for you.
            </p>
            
            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              Why Choose Custom Filters?
            </h3>
            <ul className="list-disc pl-6 text-brand-gray-700 space-y-2 mb-6">
              <li>
                <strong>Perfect Fit:</strong> Custom dimensions mean no gaps or ill-fitting filters that reduce 
                efficiency and let unfiltered air through.
              </li>
              <li>
                <strong>Any Size:</strong> From 4" to 30" in height, 4" to 36" in width, and 1", 2", or 4" depth.
              </li>
              <li>
                <strong>Quality Materials:</strong> Made in the USA with premium filter media, just like our 
                standard filters.
              </li>
              <li>
                <strong>Fast Production:</strong> Most custom filters ship within 2-3 business days.
              </li>
              <li>
                <strong>Same Great Warranty:</strong> 365-day return policy applies to custom filters too!
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              Custom vs. Standard Filters
            </h3>
            <p className="text-brand-gray-700 mb-4">
              <strong>Standard Filters:</strong> If your filter size is close to a common measurement (like 16x20x1, 
              20x25x1, etc.), we recommend browsing our{' '}
              <a href="/air-filters" className="text-brand-orange hover:underline">
                standard air filters
              </a>
              . They're in stock and ship same-day!
            </p>
            <p className="text-brand-gray-700 mb-6">
              <strong>Custom Filters:</strong> For non-standard sizes (like 17.5x24.25x1 or 19x22x2), use our 
              custom builder. We manufacture these to order with your exact dimensions.
            </p>

            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              How to Measure for Custom Filters
            </h3>
            <ol className="list-decimal pl-6 text-brand-gray-700 space-y-2 mb-6">
              <li>
                <strong>Remove Your Current Filter:</strong> Take out the old filter from your HVAC system.
              </li>
              <li>
                <strong>Measure the Actual Filter:</strong> Use a tape measure to get the exact dimensions - 
                height × width × depth in inches.
              </li>
              <li>
                <strong>Round to Quarter Inches:</strong> We can manufacture filters in 0.25" increments 
                (e.g., 16.25", 20.75").
              </li>
              <li>
                <strong>Choose Your MERV Rating:</strong> Select the filtration level that matches your air 
                quality needs.
              </li>
            </ol>

            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="font-semibold text-brand-gray-900">How long does it take to make a custom filter?</p>
                <p className="text-brand-gray-700">
                  Most custom filters are manufactured and shipped within 2-3 business days.
                </p>
              </div>
              <div>
                <p className="font-semibold text-brand-gray-900">Can I return a custom filter?</p>
                <p className="text-brand-gray-700">
                  Yes! Our 365-day return policy applies to custom filters. If it doesn't fit or meet your 
                  expectations, we'll make it right.
                </p>
              </div>
              <div>
                <p className="font-semibold text-brand-gray-900">What's the maximum custom size?</p>
                <p className="text-brand-gray-700">
                  Height: up to 30", Width: up to 36", Depth: 1", 2", or 4"
                </p>
              </div>
              <div>
                <p className="font-semibold text-brand-gray-900">Are custom filters more expensive?</p>
                <p className="text-brand-gray-700">
                  Custom filters typically cost 20-30% more than standard sizes due to made-to-order manufacturing, 
                  but prices are competitive and transparent.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              Made in USA, Just Like Our Standard Filters
            </h3>
            <p className="text-brand-gray-700">
              Every custom filter is manufactured in our USA facility using the same premium materials and quality 
              control processes as our standard FiltersFast® brand filters. You get the same great filtration 
              performance and durability, just in your exact dimensions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

