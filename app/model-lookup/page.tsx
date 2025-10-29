/**
 * Model Lookup Page
 * Public-facing page for finding appliance models
 */

import ModelLookupBase from '@/components/models/ModelLookup';
import { Suspense } from 'react';

function ModelLookup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
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
    <div className="min-h-screen bg-gray-50">
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
              <h3 className="font-semibold text-gray-900 mb-2">1. Search</h3>
              <p className="text-sm text-gray-600">
                Enter your appliance model number or brand name
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Find</h3>
              <p className="text-sm text-gray-600">
                See all compatible filters for your specific model
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Save</h3>
              <p className="text-sm text-gray-600">
                Save models for quick reordering and reminders
              </p>
            </div>
          </div>

          {/* Popular Brands */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Popular Brands
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['GE', 'Samsung', 'Whirlpool', 'LG', 'Honeywell', 'Carrier', 'Trane', 'Lennox', 'Aprilaire', 'Goodman'].map(brand => (
                <button
                  key={brand}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-orange hover:shadow-md transition-all text-center font-medium text-gray-700"
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

