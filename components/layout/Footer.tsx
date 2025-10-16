import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-gray-800 text-white">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-brand-orange">Filters</span>
              <span className="text-white">Fast</span>
            </h3>
            <p className="text-brand-gray-300 mb-4">
              America&apos;s Top Online Filtration Retailer. Huge Selection. Unbeatable Quality. 365-Day Returns.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-brand-orange transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-orange transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-orange transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-orange transition-colors">
                <Youtube className="w-5 h-5" />
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
              <li><Link href="/sale" className="hover:text-brand-orange transition-colors">Shop Sale</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li><Link href="/track-order" className="hover:text-brand-orange transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="hover:text-brand-orange transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/support" className="hover:text-brand-orange transition-colors">Help & Support</Link></li>
              <li><Link href="/auto-delivery" className="hover:text-brand-orange transition-colors">Home Filter Club</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold mb-4">About FiltersFast</h4>
            <ul className="space-y-2 text-brand-gray-300">
              <li><Link href="/our-story" className="hover:text-brand-orange transition-colors">Our Story</Link></li>
              <li><Link href="/our-brand" className="hover:text-brand-orange transition-colors">Our Brand</Link></li>
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

