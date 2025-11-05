'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Search, Phone, Menu, X, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { useSession } from '@/lib/auth-client';
import SearchPreview from '@/components/search/SearchPreview';
import { SearchableProduct } from '@/lib/types';
import { CurrencySelector } from '@/components/layout/CurrencySelector';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { itemCount } = useCart();
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchPreview(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchPreview(e.target.value.length >= 2);
  };

  const handleProductSelect = (product: SearchableProduct) => {
    // Clear search and close preview (navigation handled by Link component)
    setSearchQuery('');
    setShowSearchPreview(false);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (searchQuery.length >= 2) {
      setShowSearchPreview(true);
    }
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  const closeSearchPreview = () => {
    setShowSearchPreview(false);
  };

  // Close preview when clicking outside
  useEffect(() => {
    if (!showSearchPreview) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchPreview(false);
      }
    };

    // Add listener after a brief delay to avoid closing immediately
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showSearchPreview]);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md transition-colors">
      {/* Top Banner */}
      <div className="bg-brand-orange text-white py-2">
        <div className="container-custom">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <span className="font-semibold">⭐ Over 62,000 5-star reviews</span>
              <span className="hidden md:inline">Free Shipping on Orders $99+</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/support" className="hidden md:inline hover:underline font-medium">
                Support
              </Link>
              <Link href="/track-order" className="hidden sm:inline hover:underline font-medium">
                Track Order
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <LanguageSelector />
                <CurrencySelector />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="font-semibold">1-866-438-3458</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/filtersfast-logo.png"
              alt="FiltersFast - Filter. Purify. Protect."
              width={200}
              height={60}
              priority
              className="h-auto w-auto max-h-14 dark:border-2 dark:border-white transition-all"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div ref={searchRef} className="relative w-full">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <label htmlFor="desktop-search" className="sr-only">
                  Search for filters by part number, brand, or product
                </label>
                <input
                  id="desktop-search"
                  type="text"
                  placeholder="Search by part #, brand, or product..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
                  aria-describedby="search-help"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange text-white p-2 rounded hover:bg-brand-orange-dark transition-colors focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                  aria-label="Search for filters"
                >
                  <Search className="w-5 h-5" />
                </button>
                <div id="search-help" className="sr-only">
                  Enter a part number, brand name, or product description to search our filter catalog
                </div>
              </form>
              
              {/* Search Preview Dropdown */}
              <SearchPreview
                query={searchQuery}
                isVisible={showSearchPreview}
                onSelectProduct={handleProductSelect}
                onClose={closeSearchPreview}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {session ? (
              <Link 
                href="/account" 
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {session.user.name?.charAt(0).toUpperCase() || session.user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name?.split(' ')[0] || 'Account'}</span>
              </Link>
            ) : (
              <Link href="/sign-in" className="hidden md:block text-sm text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
                Sign In
              </Link>
            )}
            <Link 
              href="/cart" 
              className="relative focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-lg p-1"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingCart className="w-6 h-6 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors" />
              {itemCount > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-brand-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  aria-label={`${itemCount} items in cart`}
                >
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-lg p-1"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-gray-100" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden mt-4">
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <label htmlFor="mobile-search" className="sr-only">
                Search for filters by part number, brand, or product
              </label>
              <input
                id="mobile-search"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="w-full pl-4 pr-12 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none"
                aria-describedby="mobile-search-help"
                autoComplete="off"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange text-white p-1.5 rounded focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                aria-label="Search for filters"
              >
                <Search className="w-4 h-4" />
              </button>
              <div id="mobile-search-help" className="sr-only">
                Enter a part number, brand name, or product description to search our filter catalog
              </div>
            </form>
            
            {/* Search Preview Dropdown - Mobile */}
            <SearchPreview
              query={searchQuery}
              isVisible={showSearchPreview}
              onSelectProduct={handleProductSelect}
              onClose={closeSearchPreview}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-brand-blue text-white">
        <div className="container-custom">
          <div className="hidden md:flex items-center justify-center gap-8 py-3">
            <Link 
              href="/model-lookup" 
              className={`${pathname === '/model-lookup' ? 'bg-white/20 font-bold' : 'bg-white/10'} hover:text-brand-orange transition-colors font-medium px-4 py-2 rounded-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-blue`}
              aria-label="Find filter by appliance model"
              aria-current={pathname === '/model-lookup' ? 'page' : undefined}
            >
              <span role="img" aria-label="Search icon">🔍</span> Find My Filter
            </Link>
            <Link 
              href="/auto-delivery" 
              className={`${pathname === '/auto-delivery' ? 'bg-white/20 font-bold' : 'bg-white/10'} hover:text-brand-orange transition-colors font-medium px-4 py-2 rounded-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-blue`}
              aria-label="Home Filter Club - Subscribe and save"
              aria-current={pathname === '/auto-delivery' ? 'page' : undefined}
            >
              <span role="img" aria-label="Shield icon">🛡️</span> Filter Club
            </Link>
            <Link 
              href="/refrigerator-filters" 
              className={`${pathname === '/refrigerator-filters' ? 'bg-white/20 font-bold' : ''} hover:text-brand-orange transition-colors font-medium px-3 py-2 rounded-lg`}
              aria-current={pathname === '/refrigerator-filters' ? 'page' : undefined}
            >
              Refrigerator Filters
            </Link>
            <Link 
              href="/air-filters" 
              className={`${pathname === '/air-filters' ? 'bg-white/20 font-bold' : ''} hover:text-brand-orange transition-colors font-medium px-3 py-2 rounded-lg`}
              aria-current={pathname === '/air-filters' ? 'page' : undefined}
            >
              Air Filters
            </Link>
            <Link 
              href="/water-filters" 
              className={`${pathname === '/water-filters' ? 'bg-white/20 font-bold' : ''} hover:text-brand-orange transition-colors font-medium px-3 py-2 rounded-lg`}
              aria-current={pathname === '/water-filters' ? 'page' : undefined}
            >
              Water Filters
            </Link>
            <Link 
              href="/pool-filters" 
              className={`${pathname === '/pool-filters' ? 'bg-white/20 font-bold' : ''} hover:text-brand-orange transition-colors font-medium px-3 py-2 rounded-lg`}
              aria-current={pathname === '/pool-filters' ? 'page' : undefined}
            >
              Pool & Spa
            </Link>
            <Link 
              href="/humidifier-filters" 
              className={`${pathname === '/humidifier-filters' ? 'bg-white/20 font-bold' : ''} hover:text-brand-orange transition-colors font-medium px-3 py-2 rounded-lg`}
              aria-current={pathname === '/humidifier-filters' ? 'page' : undefined}
            >
              Humidifier Filters
            </Link>
            <Link 
              href="/sale" 
              className={`${pathname === '/sale' ? 'bg-brand-orange/20 font-bold' : ''} hover:text-brand-orange transition-colors font-medium text-brand-orange px-3 py-2 rounded-lg`}
              aria-current={pathname === '/sale' ? 'page' : undefined}
            >
              Sale
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-colors"
          role="menu"
          aria-label="Main navigation"
        >
          <div className="container-custom py-4 space-y-4">
            <Link 
              href="/model-lookup" 
              className="block py-3 px-4 bg-brand-orange/10 rounded-lg text-brand-orange font-bold hover:bg-brand-orange/20 transition-colors focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
              aria-label="Find filter by searching your appliance model number or brand"
            >
              <span role="img" aria-label="Search icon">🔍</span> Find My Filter by Model
            </Link>
            <Link 
              href="/auto-delivery" 
              className="block py-3 px-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-brand-blue dark:text-blue-400 font-bold hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              aria-label="Home Filter Club - Subscribe and save with interactive wizard"
            >
              <span role="img" aria-label="Shield icon">🛡️</span> Filter Club
            </Link>
            <hr />
            <Link href="/refrigerator-filters" className="block py-2 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
              Refrigerator Filters
            </Link>
            <Link href="/air-filters" className="block py-2 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
              Air Filters
            </Link>
            <Link href="/water-filters" className="block py-2 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
              Water Filters
            </Link>
            <Link href="/pool-filters" className="block py-2 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
              Pool & Spa Filters
            </Link>
            <Link href="/humidifier-filters" className="block py-2 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
              Humidifier Filters
            </Link>
            <Link href="/sale" className="block py-2 text-brand-orange font-semibold">
              Sale
            </Link>
            <hr />
            {session ? (
              <Link href="/account" className="block py-2 hover:text-brand-orange transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || session.user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">{session.user.name || 'My Account'}</span>
                </div>
              </Link>
            ) : (
              <Link href="/sign-in" className="block py-2 text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors">
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

