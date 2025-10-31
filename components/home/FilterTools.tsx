'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Search, Droplet, Wind, Bookmark } from 'lucide-react';

export default function FilterTools() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'model' | 'water' | 'air'>('model');
  const [partNumber, setPartNumber] = useState('');
  const [airWidth, setAirWidth] = useState('');
  const [airHeight, setAirHeight] = useState('');
  const [airDepth, setAirDepth] = useState('1');
  const [modelSearch, setModelSearch] = useState('');

  const handleWaterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for part number:', partNumber);
  };

  const handleAirSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for air filter:', { airWidth, airHeight, airDepth });
  };

  const handleModelSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (modelSearch.trim()) {
      router.push(`/model-lookup?q=${encodeURIComponent(modelSearch)}`);
    }
  };

  return (
    <section className="py-16 bg-brand-gray-50 dark:bg-gray-800 transition-colors">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">
            Find Your Perfect Filter
          </h2>
          <p className="text-lg text-brand-gray-600 dark:text-gray-300 transition-colors">
            Search by part number, brand, or custom size
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div 
            className="inline-flex rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1 transition-colors" 
            role="tablist"
            aria-label="Filter search methods"
          >
            <button
              onClick={() => setActiveTab('model')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all ${
                activeTab === 'model'
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-gray-600 dark:text-gray-300 hover:text-brand-orange'
              }`}
              role="tab"
              aria-selected={activeTab === 'model'}
              aria-controls="model-panel"
              id="model-tab"
              tabIndex={activeTab === 'model' ? 0 : -1}
            >
              <Bookmark className="w-5 h-5" aria-hidden="true" />
              Find by Model
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all ${
                activeTab === 'water'
                  ? 'bg-brand-blue text-white'
                  : 'text-brand-gray-600 dark:text-gray-300 hover:text-brand-blue'
              }`}
              role="tab"
              aria-selected={activeTab === 'water'}
              aria-controls="water-panel"
              id="water-tab"
              tabIndex={activeTab === 'water' ? 0 : -1}
            >
              <Droplet className="w-5 h-5" aria-hidden="true" />
              <span className="hidden lg:inline">Refrigerator Water Filters</span>
              <span className="lg:hidden">Water</span>
            </button>
            <button
              onClick={() => setActiveTab('air')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all ${
                activeTab === 'air'
                  ? 'bg-brand-blue text-white'
                  : 'text-brand-gray-600 dark:text-gray-300 hover:text-brand-blue'
              }`}
              role="tab"
              aria-selected={activeTab === 'air'}
              aria-controls="air-panel"
              id="air-tab"
              tabIndex={activeTab === 'air' ? 0 : -1}
            >
              <Wind className="w-5 h-5" aria-hidden="true" />
              <span className="hidden lg:inline">Air Filters</span>
              <span className="lg:hidden">Air</span>
            </button>
          </div>
        </div>

        {/* Model Lookup */}
        {activeTab === 'model' && (
          <div 
            className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors"
            role="tabpanel"
            id="model-panel"
            aria-labelledby="model-tab"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bookmark className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              <div>
                <h3 className="text-xl font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Find the Right Filter for Your Appliance</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Search by model number or brand to find compatible filters</p>
              </div>
            </div>

            <form onSubmit={handleModelSearch} className="space-y-6">
              <div>
                <label htmlFor="model-search-home" className="block text-sm font-semibold text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Enter Your Appliance Model Number or Brand
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="model-search-home"
                    placeholder="e.g., GE GSS25GSHSS or Samsung RF28..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="flex-1 input-field"
                    aria-describedby="model-help-text"
                    maxLength={100}
                  />
                  <Button type="submit" className="flex items-center gap-2" aria-label="Search for appliance model">
                    <Search className="w-5 h-5" aria-hidden="true" />
                    Find It
                  </Button>
                </div>
                <p id="model-help-text" className="sr-only">
                  Enter your appliance brand or full model number to find compatible replacement filters
                </p>
              </div>

              <div 
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors"
                role="note"
                aria-label="Help finding your model number"
              >
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 transition-colors">
                  <span role="img" aria-label="Light bulb">💡</span> Not sure what your model number is?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3 transition-colors">
                  Your appliance model number is usually found on a label or tag on the inside or back of your unit.
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-none transition-colors">
                  <li>• <strong>Refrigerators:</strong> Inside the fridge, on the side wall</li>
                  <li>• <strong>HVAC/Furnace:</strong> On the unit's metal panel</li>
                  <li>• <strong>Humidifier:</strong> On the water panel or main unit</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <p className="col-span-2 md:col-span-4 text-sm font-semibold text-brand-gray-700 dark:text-gray-300 mb-1 transition-colors" id="popular-brands-label">
                  Popular Brands:
                </p>
                {['GE', 'Samsung', 'Whirlpool', 'LG', 'Honeywell', 'Carrier', 'Trane', 'Lennox'].map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      setModelSearch(brand);
                      router.push(`/model-lookup?q=${brand}`);
                    }}
                    className="px-4 py-2 border-2 border-brand-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-orange hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10 transition-all font-semibold text-brand-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                    aria-label={`Search for ${brand} models`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </form>
          </div>
        )}

        {/* Water Filter Search */}
        {activeTab === 'water' && (
          <div 
            className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors"
            role="tabpanel"
            id="water-panel"
            aria-labelledby="water-tab"
          >
            <div className="flex items-center gap-3 mb-6">
              <Droplet className="w-8 h-8 text-brand-blue" />
              <div>
                <h3 className="text-xl font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Replace Your Refrigerator Water Filter</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Search by part number or select your brand</p>
              </div>
            </div>

            <form onSubmit={handleWaterSearch} className="space-y-6">
              <div>
                <label htmlFor="partNumber" className="block text-sm font-semibold text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Search by Part #
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="partNumber"
                    placeholder="Enter part number (e.g., MWF, EDR1RXD1)"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className="flex-1 input-field"
                  />
                  <Button type="submit" className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Find It
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-brand-gray-500 dark:text-gray-400 font-medium transition-colors">OR</span>
                </div>
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-semibold text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Search by Filter Brand
                </label>
                <div className="flex gap-3">
                  <select
                    id="brand"
                    className="flex-1 input-field"
                  >
                    <option value="">Select Brand</option>
                    <option value="ge">GE</option>
                    <option value="whirlpool">Whirlpool</option>
                    <option value="lg">LG</option>
                    <option value="samsung">Samsung</option>
                    <option value="frigidaire">Frigidaire</option>
                    <option value="kenmore">Kenmore</option>
                    <option value="kitchenaid">KitchenAid</option>
                    <option value="maytag">Maytag</option>
                  </select>
                  <Button type="button" variant="secondary">Go</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                {['GE', 'Whirlpool', 'LG', 'Samsung', 'Frigidaire', 'Kenmore'].map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    className="px-4 py-3 border-2 border-brand-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-orange hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10 transition-all font-semibold text-brand-gray-700 dark:text-gray-300"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </form>
          </div>
        )}

        {/* Air Filter Search */}
        {activeTab === 'air' && (
          <div 
            className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors"
            role="tabpanel"
            id="air-panel"
            aria-labelledby="air-tab"
          >
            <div className="flex items-center gap-3 mb-6">
              <Wind className="w-8 h-8 text-brand-blue" />
              <div>
                <h3 className="text-xl font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Replace Your Air Filter</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Select your filter by size</p>
              </div>
            </div>

            <form onSubmit={handleAirSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-brand-gray-700 dark:text-gray-300 mb-3 transition-colors">
                  Select Your Filter Size
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="width" className="block text-xs text-brand-gray-600 dark:text-gray-400 mb-1 transition-colors">
                      Short side (W) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="width"
                      placeholder="W"
                      maxLength={4}
                      value={airWidth}
                      onChange={(e) => setAirWidth(e.target.value)}
                      className="input-field text-center"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="height" className="block text-xs text-brand-gray-600 dark:text-gray-400 mb-1 transition-colors">
                      Long side (H) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="height"
                      placeholder="H"
                      maxLength={4}
                      value={airHeight}
                      onChange={(e) => setAirHeight(e.target.value)}
                      className="input-field text-center"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="depth" className="block text-xs text-brand-gray-600 dark:text-gray-400 mb-1 transition-colors">
                      Thick side (D) <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="depth"
                      value={airDepth}
                      onChange={(e) => setAirDepth(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="1">1&quot;</option>
                      <option value="2">2&quot;</option>
                      <option value="4">4&quot;</option>
                      <option value="5">5&quot;</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-brand-gray-500 dark:text-gray-400 mt-2 transition-colors">
                  Enter dimensions in inches (e.g., 16 x 20 x 1)
                </p>
              </div>

              <Button type="submit" className="w-full">
                Find My Filter Size
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-brand-gray-500 dark:text-gray-400 font-medium transition-colors">OR</span>
                </div>
              </div>

              <div>
                <label htmlFor="airBrand" className="block text-sm font-semibold text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Search by Air Filter Brand
                </label>
                <div className="flex gap-3">
                  <select
                    id="airBrand"
                    className="flex-1 input-field"
                  >
                    <option value="">Select Brand</option>
                    <option value="aprilaire">Aprilaire</option>
                    <option value="bryant">Bryant</option>
                    <option value="carrier">Carrier</option>
                    <option value="filtrete">3M Filtrete</option>
                    <option value="honeywell">Honeywell</option>
                    <option value="lennox">Lennox</option>
                  </select>
                  <Button type="button" variant="secondary">Go</Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

