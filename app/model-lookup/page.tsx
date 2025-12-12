/**
 * Model Lookup Page
 * Public-facing page for finding appliance models
 */

import ModelLookupBase from '@/components/models/ModelLookup';
import { Suspense } from 'react';

function ModelLookup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-gray-100">Loading...</div>}>
      <ModelLookupBase />
    </Suspense>
  );
}
import { Bookmark, Search, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Model Lookup - Find Your Filter | FiltersFast',
  description: 'Find the perfect filter for your appliance. Search by brand or model number.',
};

export default function ModelLookupPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-orange to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find the Right Filter for Your Appliance
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Search by model number or brand to find compatible filters
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">10,000+</div>
                <div className="text-sm text-white/80">Models</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-white/80">Brands</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">Verified</div>
                <div className="text-sm text-white/80">Data</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <ModelLookup />

          {/* How It Works */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">1. Search</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Enter your appliance model number or brand name
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <CheckCircle2 className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">2. Find</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                See all compatible filters for your specific model
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <Bookmark className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">3. Save</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Save models for quick reordering and reminders
              </p>
            </div>
          </div>

          {/* Popular Brands */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8 transition-colors">
              Popular Brands
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['GE', 'Samsung', 'Whirlpool', 'LG', 'Honeywell', 'Carrier', 'Trane', 'Lennox', 'Aprilaire', 'Goodman'].map(brand => (
                <button
                  key={brand}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-brand-orange hover:shadow-md transition-all text-center font-medium text-gray-700 dark:text-gray-300"
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

