'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useSession } from '@/lib/auth-client';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { RecaptchaAction } from '@/lib/recaptcha';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CharityDonation from '@/components/checkout/CharityDonation';
import SavedPaymentSelector from '@/components/checkout/SavedPaymentSelector';
import AddPaymentMethod from '@/components/payments/AddPaymentMethod';
import { DonationSelection } from '@/lib/types/charity';
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Lock,
  Heart,
  Plus
} from 'lucide-react';

type CheckoutStep = 'account' | 'shipping' | 'payment' | 'review';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, itemCount, clearCart } = useCart();
  const { data: session } = useSession();
  const { executeRecaptcha, isReady: recaptchaReady } = useRecaptcha();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('account');
  const [isGuest, setIsGuest] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [donation, setDonation] = useState<DonationSelection | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  // Auto-populate email if logged in
  useEffect(() => {
    if (session?.user?.email) {
      setShippingAddress(prev => ({
        ...prev,
        email: session.user.email,
      }));
      setCurrentStep('shipping'); // Skip account step if logged in
    }
  }, [session]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      router.push('/cart');
    }
  }, [items, router, isProcessing]);

  const shippingCost = total >= 50 ? 0 : 9.99;
  const tax = total * 0.08; // 8% tax (would be calculated by TaxJar in production)
  const donationAmount = donation?.amount || 0;
  const orderTotal = total + shippingCost + tax + donationAmount;

  // Step navigation
  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setCurrentStep('shipping');
  };

  const handleLoginRedirect = () => {
    // Save cart and redirect to login
    router.push('/sign-in?redirect=/checkout');
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate shipping form
    if (!shippingAddress.firstName || !shippingAddress.lastName || 
        !shippingAddress.email || !shippingAddress.address1 ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      setError('Please fill in all required fields');
      return;
    }
    
    setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Execute reCAPTCHA verification to prevent bot orders
      let recaptchaToken = '';
      try {
        recaptchaToken = await executeRecaptcha(RecaptchaAction.CHECKOUT);
      } catch (recaptchaError) {
        console.error('reCAPTCHA error:', recaptchaError);
        setError('Security verification failed. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      // Verify reCAPTCHA token on server
      try {
        const verifyResponse = await fetch('/api/recaptcha/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: recaptchaToken,
            action: RecaptchaAction.CHECKOUT,
          }),
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
          setError('Security verification failed. Please try again.');
          setIsProcessing(false);
          return;
        }
      } catch (verifyError) {
        console.error('reCAPTCHA verification error:', verifyError);
        setError('Security verification failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Create checkout session with Stripe (including donation if present)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          donation: donation || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      
      // In production, redirect to Stripe checkout
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear cart
      clearCart();
      
      // Redirect to success page
      router.push('/checkout/success?session_id=' + sessionId);
    } catch (err) {
      setError('Failed to process order. Please try again.');
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'shipping', label: 'Shipping', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (items.length === 0 && !isProcessing) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted ? 'bg-green-600 text-white' :
                        isActive ? 'bg-brand-orange text-white' :
                        'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-brand-orange' : 
                        isCompleted ? 'text-green-600 dark:text-green-400' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors">
              <p className="text-sm text-red-800 dark:text-red-300 transition-colors">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Account Step */}
              {currentStep === 'account' && (
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
                    How would you like to checkout?
                  </h2>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleLoginRedirect}
                      className="w-full p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-orange transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Sign In to Your Account</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                            Save your address and track your orders
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleContinueAsGuest}
                      className="w-full p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-orange transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                          <ShoppingBag className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Continue as Guest</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                            Quick checkout without creating an account
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </Card>
              )}

              {/* Shipping Step */}
              {currentStep === 'shipping' && (
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
                    Shipping Address
                  </h2>
                  
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.firstName}
                          onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.lastName}
                          onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                        disabled={!!session}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.address1}
                        onChange={(e) => setShippingAddress({...shippingAddress, address1: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Street address"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        value={shippingAddress.address2}
                        onChange={(e) => setShippingAddress({...shippingAddress, address2: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Apartment, suite, etc. (optional)"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="CA"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/cart')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Cart
                      </Button>
                      
                      <Button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        Continue to Payment
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Payment Step */}
              {currentStep === 'payment' && (
                <div className="space-y-6">
                  {/* Charity Donation Section */}
                  <CharityDonation
                    orderSubtotal={total + shippingCost + tax}
                    onDonationChange={setDonation}
                    initialDonation={donation}
                  />
                  
                  {/* Payment Method Section */}
                  <Card className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
                    Payment Method
                  </h2>
                    
                    {/* Show saved cards for logged-in users */}
                    {session && !showAddPaymentForm ? (
                      <SavedPaymentSelector
                        selectedPaymentMethodId={selectedPaymentMethodId}
                        onSelectPaymentMethod={setSelectedPaymentMethodId}
                        onAddNew={() => setShowAddPaymentForm(true)}
                      />
                    ) : session && showAddPaymentForm ? (
                      <AddPaymentMethod
                        onSuccess={() => {
                          setShowAddPaymentForm(false);
                          setError('');
                          // Payment method saved, user can now select it
                        }}
                        onCancel={() => setShowAddPaymentForm(false)}
                      />
                    ) : (
                      /* Guest checkout - Stripe Hosted Checkout */
                      <div className="space-y-4">
                        <div className="border-2 border-brand-orange rounded-lg p-4 bg-brand-orange/5 dark:bg-brand-orange/10 transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-6 h-6 text-brand-orange" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Secure Checkout with Stripe</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 transition-colors">
                            Click "Review Order" to continue. You'll be redirected to Stripe's secure checkout page to enter your payment details.
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            <span className="flex items-center gap-1 bg-white dark:bg-gray-700 px-2 py-1 rounded transition-colors">
                              <Lock className="w-3 h-3" />
                              PCI Compliant
                            </span>
                            <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded transition-colors">💳 Visa</span>
                            <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded transition-colors">💳 Mastercard</span>
                            <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded transition-colors">💳 Amex</span>
                            <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded transition-colors">💳 Discover</span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
                          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2 transition-colors">
                            💡 <strong>Want faster checkout next time?</strong>
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-200 transition-colors">
                            <Link href="/sign-up" className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors">
                              Create an account
                            </Link>
                            {' '}to save your payment methods for 1-click checkout on future orders.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!showAddPaymentForm && (
                      <div className="flex gap-4 mt-6">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep('shipping')}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </Button>
                        
                        <Button
                          onClick={() => {
                            // Validate payment method is selected for logged-in users
                            if (session && !selectedPaymentMethodId) {
                              setError('Please select a payment method or add a new one');
                              return;
                            }
                            setError('');
                            setCurrentStep('review');
                          }}
                          className="flex-1 flex items-center justify-center gap-2"
                          disabled={session && !selectedPaymentMethodId || false}
                        >
                          {session ? 'Review Order' : 'Review & Pay'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
                    Review Your Order
                  </h2>
                  
                  {/* Shipping Address Review */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Shipping Address</h3>
                      <button
                        onClick={() => setCurrentStep('shipping')}
                        className="text-sm text-brand-orange hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                      <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                      <p>{shippingAddress.address1}</p>
                      {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                      <p>{shippingAddress.email}</p>
                      {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors">Order Items</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Donation Review */}
                  {donation && (
                    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 transition-colors">
                          <Heart className="w-5 h-5 text-red-500" />
                          Charitable Donation
                        </h3>
                        <button
                          onClick={() => setCurrentStep('payment')}
                          className="text-sm text-brand-orange hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 transition-colors">
                        <p className="font-medium text-green-800 dark:text-green-300 transition-colors">
                          Thank you for your ${donationAmount.toFixed(2)} donation!
                        </p>
                        <p className="text-green-700 dark:text-green-200 mt-1 transition-colors">
                          Your generosity helps make a difference.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCurrentStep('payment')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || !recaptchaReady}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : !recaptchaReady ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading security...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Order Summary</h3>
                
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300 transition-colors">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 transition-colors">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 transition-colors">Shipping</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 transition-colors">Tax (estimated)</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">${tax.toFixed(2)}</span>
                  </div>
                  {donation && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1 transition-colors">
                        <Heart className="w-3 h-3 text-red-500" />
                        Donation
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400 transition-colors">${donationAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span className="text-gray-900 dark:text-gray-100 transition-colors">Total</span>
                  <span className="text-brand-orange">${orderTotal.toFixed(2)}</span>
                </div>
                
                {total < 50 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300 transition-colors">
                    Add ${(50 - total).toFixed(2)} more for free shipping!
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
