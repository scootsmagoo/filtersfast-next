import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Headset, UserCircle, Home, Key } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-gray-800 dark:bg-gray-950 text-white transition-colors">
      {/* Top Banner: Reorder, Home Filter Club, Additional Questions */}
      <div className="bg-brand-gray-900 dark:bg-black py-8 border-b border-brand-gray-700 dark:border-gray-800 transition-colors">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Reorder Filters */}
            <Link 
              href="/account"
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-brand-gray-800 transition-colors group"
              aria-label="Reorder filters - Login, confirm order, done"
            >
              <div className="relative flex-shrink-0">
                <UserCircle className="w-12 h-12 text-white" aria-hidden="true" />
                <Key className="w-6 h-6 text-white absolute -bottom-1 -right-1" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-orange transition-colors">
                  REORDER FILTERS
                </h3>
                <p className="text-brand-gray-300 text-sm">
                  Login. Confirm Order. Done
                </p>
              </div>
            </Link>

            {/* Home Filter Club */}
            <Link 
              href="/auto-delivery"
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-brand-gray-800 transition-colors group"
              aria-label="Home Filter Club - Filtration essentials delivered on a customizable schedule"
            >
              <Home className="w-12 h-12 text-white flex-shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-orange transition-colors">
                  HOME FILTER CLUB
                </h3>
                <p className="text-brand-gray-300 text-sm">
                  Filtration essentials delivered on a customizable schedule.
                </p>
              </div>
            </Link>

            {/* Additional Questions */}
            <div className="flex items-center gap-4 p-4">
              <Headset className="w-12 h-12 text-white flex-shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  ADDITIONAL QUESTIONS?
                </h3>
                <div className="text-brand-gray-300 text-sm space-y-1">
                  <p>
                    <a 
                      href="mailto:support@filtersfast.com" 
                      className="hover:text-brand-orange transition-colors underline"
                      aria-label="Email us at support@filtersfast.com"
                    >
                      Email us
                    </a>
                    {' '}or call{' '}
                    <a 
                      href="tel:+18664383458" 
                      className="text-brand-orange font-bold hover:text-brand-orange-dark transition-colors whitespace-nowrap"
                      aria-label="Call us at 866-438-3458"
                    >
                      (866) 438-3458
                    </a>
                  </p>
                  <p>
                    Text us:{' '}
                    <a 
                      href="sms:+17042289166" 
                      className="text-brand-orange font-bold hover:text-brand-orange-dark transition-colors whitespace-nowrap"
                      aria-label="Text us at 704-228-9166"
                    >
                      (704) 228-9166
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-brand-orange">
              FiltersFast
            </h3>
            <p className="text-brand-gray-300 mb-4">
              America&apos;s Top Online Filtration Retailer. Huge Selection. Unbeatable Quality. 365-Day Returns.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/filtersfast" 
                className="hover:text-brand-orange transition-colors"
                aria-label="Visit our Facebook page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://twitter.com/filtersfast" 
                className="hover:text-brand-orange transition-colors"
                aria-label="Visit our Twitter page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://www.instagram.com/filtersfast" 
                className="hover:text-brand-orange transition-colors"
                aria-label="Visit our Instagram page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://www.youtube.com/filtersfast" 
                className="hover:text-brand-orange transition-colors"
                aria-label="Visit our YouTube channel"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold mb-4">Shop</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li><Link href="/refrigerator-filters" className="hover:text-brand-orange transition-colors">Refrigerator Water Filters</Link></li>
              <li><Link href="/air-filters" className="hover:text-brand-orange transition-colors">Air Filters</Link></li>
              <li><Link href="/water-filters" className="hover:text-brand-orange transition-colors">Water Filters</Link></li>
              <li><Link href="/pool-filters" className="hover:text-brand-orange transition-colors">Pool & Spa Filters</Link></li>
              <li><Link href="/humidifier-filters" className="hover:text-brand-orange transition-colors">Humidifier Filters</Link></li>
            </ul>
          </div>

          {/* Discounts & Rewards */}
          <div>
            <h4 className="font-bold mb-4">Discounts &amp; Rewards</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li><Link href="/military-discount" className="hover:text-brand-orange transition-colors">Military &amp; First Responder Discount</Link></li>
              <li><Link href="/partners/american-home-shield" className="hover:text-brand-orange transition-colors">American Home Shield</Link></li>
              <li><Link href="/partners/frontdoor" className="hover:text-brand-orange transition-colors">Frontdoor Discount</Link></li>
              <li><Link href="/auto-delivery" className="hover:text-brand-orange transition-colors">Home Filter Club</Link></li>
              <li><Link href="/sale" className="hover:text-brand-orange transition-colors">Shop Sale</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li><Link href="/support" className="hover:text-brand-orange transition-colors">Support Center</Link></li>
              <li><Link href="/track-order" className="hover:text-brand-orange transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="hover:text-brand-orange transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/account/newsletter" className="hover:text-brand-orange transition-colors">Email Preferences</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Learn & Resources */}
          <div>
            <h4 className="font-bold mb-4">Learn &amp; Resources</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li>
                <Link href="/blog" className="hover:text-brand-orange transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a 
                  href="https://forums.filtersfast.com/forums/" 
                  className="hover:text-brand-orange transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Forums
                </a>
              </li>
              <li><Link href="/links" className="hover:text-brand-orange transition-colors">Educational Resources</Link></li>
              <li><Link href="/model-lookup" className="hover:text-brand-orange transition-colors">Model Lookup Tool</Link></li>
              <li><Link href="/auto-delivery" className="hover:text-brand-orange transition-colors">Filter Club</Link></li>
              <li><Link href="/custom-air-filters" className="hover:text-brand-orange transition-colors">Custom Filter Builder</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold mb-4">About FiltersFast</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li><Link href="/our-story" className="hover:text-brand-orange transition-colors">Our Story</Link></li>
              <li><Link href="/our-brand" className="hover:text-brand-orange transition-colors">Our Brand</Link></li>
              <li><Link href="/partners" className="hover:text-brand-orange transition-colors">Our Partners</Link></li>
              <li><Link href="/affiliate" className="hover:text-brand-orange transition-colors">Affiliate Program</Link></li>
              <li><Link href="/reviews" className="hover:text-brand-orange transition-colors">Reviews</Link></li>
              <li><Link href="/business-services" className="hover:text-brand-orange transition-colors">Business Services</Link></li>
              <li><Link href="/careers" className="hover:text-brand-orange transition-colors">Careers</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-brand-gray-700">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-brand-gray-400">
            <p>&copy; {new Date().getFullYear()} FiltersFast. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-brand-orange transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-brand-orange transition-colors">Privacy Policy</Link>
              <Link href="/accessibility" className="hover:text-brand-orange transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

