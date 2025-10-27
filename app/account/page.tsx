'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { User, Mail, ShoppingBag, Heart, Settings, LogOut, Loader2 } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
          },
        },
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user.name || 'there'}!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-brand-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.name || 'User'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg bg-brand-orange/10 text-brand-orange font-medium">
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                  <ShoppingBag className="w-5 h-5" />
                  Orders
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                  <Heart className="w-5 h-5" />
                  Favorites
                </button>
                <Link href="/account/settings" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <hr className="my-4" />
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5" />
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Account Information
                </h2>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">{user.name || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Orders */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Recent Orders
              </h2>
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
                <Link href="/refrigerator-filters">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            </Card>

            {/* Saved Addresses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Saved Addresses
                </h2>
                <Button variant="secondary" size="sm">
                  Add Address
                </Button>
              </div>
              <div className="text-center py-12">
                <p className="text-gray-600">No saved addresses</p>
              </div>
            </Card>

            {/* Subscription */}
            <Card className="p-6 bg-gradient-to-br from-brand-orange/10 to-brand-blue/10 border-brand-orange/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    🎯 Home Filter Club
                  </h2>
                  <p className="text-gray-700">
                    Save 5% and never forget to change your filters
                  </p>
                </div>
              </div>
              <Link href="/auto-delivery">
                <Button className="mt-4">
                  Learn More
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

