'use client';

import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
      
      <div className="container-custom py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block bg-brand-orange px-4 py-2 rounded-full text-sm font-semibold">
              ⭐ Over 62,000 5-Star Reviews
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Trusted Replacement Filters from America&apos;s Top Online Filtration Retailer
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100">
              Huge Selection. Unbeatable Quality. 365-Day Returns.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/refrigerator-filters">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Shop Refrigerator Filters
                </Button>
              </Link>
              <Link href="/air-filters">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-brand-blue">
                  Shop Air Filters
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Free Shipping $99+</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">365-Day Returns</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Showcase */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="text-brand-orange text-3xl font-bold mb-2">2M+</div>
                  <div className="text-sm">Happy Customers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="text-brand-orange text-3xl font-bold mb-2">5K+</div>
                  <div className="text-sm">Products Available</div>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="text-brand-orange text-3xl font-bold mb-2">24/7</div>
                  <div className="text-sm">Customer Support</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="text-brand-orange text-3xl font-bold mb-2">Fast</div>
                  <div className="text-sm">Shipping</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white dark:text-gray-900">
          <path d="M0 48h1440V0c-240 48-720 48-1440 0v48z" fill="currentColor"/>
        </svg>
      </div>
    </section>
  );
}

