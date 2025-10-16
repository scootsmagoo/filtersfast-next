import Button from '@/components/ui/Button';
import { Package, Truck, RotateCcw, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function HomeFilterClub() {
  return (
    <section className="py-16 bg-gradient-to-br from-brand-orange to-brand-orange-dark text-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
              💰 Save Up To 10%
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Join Home Filter Club
            </h2>
            
            <p className="text-xl text-orange-100">
              Get FREE shipping on every order and save up to 10% off when you subscribe. Choose your delivery frequency, and we&apos;ll do the rest.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Free Shipping Always</h3>
                  <p className="text-orange-100">No minimum order required for subscribers</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Flexible Delivery Schedule</h3>
                  <p className="text-orange-100">Choose your frequency, pause or cancel anytime</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Never Forget Again</h3>
                  <p className="text-orange-100">Automatic reminders and deliveries</p>
                </div>
              </div>
            </div>

            <Link href="/auto-delivery">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white text-white hover:bg-white hover:text-brand-orange"
              >
                Learn More About Home Filter Club
              </Button>
            </Link>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20">
              <div className="space-y-6">
                <div className="text-center">
                  <Package className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Subscribe & Save</h3>
                  <p className="text-orange-100">Join thousands of happy subscribers</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Regular Price</span>
                    <span className="text-xl line-through">$39.99</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Subscription Discount</span>
                    <span className="text-xl text-green-300">-$4.00</span>
                  </div>
                  <div className="border-t border-white/30 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Your Price</span>
                      <span className="text-3xl font-bold">$35.99</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-orange-100">
                  + FREE shipping on all orders
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

