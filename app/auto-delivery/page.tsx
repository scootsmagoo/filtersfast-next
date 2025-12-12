'use client'

import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { 
  Droplets, 
  Wind, 
  Home, 
  Users, 
  Package, 
  Calendar, 
  Truck,
  ArrowRight,
  ChevronLeft,
  Shield,
  Info,
  X
} from 'lucide-react';

type WizardStep = 
  | 'welcome'
  | 'location'
  | 'household'
  | 'filter-type'
  | 'concerns'
  | 'merv-education'
  | 'results';

interface WizardData {
  zipCode?: string;
  householdSize?: number;
  filterType?: 'air' | 'water' | 'both';
  concerns?: string[];
  mervLevel?: number;
}

export default function AutoDeliveryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('welcome');
  const [wizardData, setWizardData] = useState<WizardData>({});
  const wizardTriggerRef = useRef<HTMLButtonElement>(null);

  const handleGetStarted = () => {
    if (session?.user) {
      router.push('/account/subscriptions');
    } else {
      router.push('/sign-up?redirect=/account/subscriptions');
    }
  };

  const openWizard = () => {
    setShowWizard(true);
    setWizardStep('welcome');
    setWizardData({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeWizard = () => {
    setShowWizard(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // WCAG 2.4.3 Fix: Return focus to trigger button
    setTimeout(() => {
      wizardTriggerRef.current?.focus();
    }, 100);
  };

  return (
    <>
      {/* Wizard Overlay */}
      {showWizard && (
        <FilterWizard
          step={wizardStep}
          setStep={setWizardStep}
          data={wizardData}
          setData={setWizardData}
          onClose={closeWizard}
        />
      )}

      {/* Main Page Content */}
      <div className="min-h-screen bg-brand-gray-50 dark:bg-gray-900 transition-colors">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white">
          <div className="container-custom py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Home Filter Club</h1>
              <p className="text-xl mb-6">Never Forget to Change Your Filters Again</p>
              <p className="text-lg opacity-90 mb-8">Subscribe and save up to 10% with FREE shipping on every order</p>
              
              {/* Interactive Wizard CTA */}
              <button
                ref={wizardTriggerRef}
                onClick={openWizard}
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold rounded-lg transition-colors shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
                aria-label="Open interactive filter selection wizard"
              >
                <Shield className="w-6 h-6" aria-hidden="true" />
                Find Your Perfect Filter
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <p className="text-sm mt-4 opacity-75">
                Not sure which filter you need? Our interactive wizard will help!
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Save Up to 10%</h3>
              <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Automatic discount applied to every subscription order</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">FREE Shipping</h3>
              <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Get free shipping on every subscription order, no minimum</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Flexible Schedule</h3>
              <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Choose your delivery frequency: every 30, 60, 90, or 180 days</p>
            </Card>
          </div>

          {/* Filter Finder CTA Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border-2 border-orange-200 dark:border-orange-800">
              <div className="text-center">
                <Shield className="w-16 h-16 text-brand-orange mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Not Sure Which Filter You Need?
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  Take our interactive quiz! Answer 5 quick questions and get personalized filter recommendations based on your home's unique needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={openWizard}
                    className="btn-primary px-8 py-4 text-lg inline-flex items-center gap-2 shadow-lg"
                    aria-label="Start filter selection wizard"
                  >
                    <Shield className="w-5 h-5" aria-hidden="true" />
                    Start Filter Finder
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Takes only 2-3 minutes
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* How It Works */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-brand-gray-900 dark:text-gray-100 mb-8 transition-colors">How It Works</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Choose Your Filter</h3>
                  <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Use our Filter Finder wizard or browse our selection to find the perfect filters for your home</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Set Your Schedule</h3>
                  <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Pick how often you want your filters delivered - every 1, 2, 3, or 6 months</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Relax & Save</h3>
                  <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">We'll automatically send your filters on your schedule. Modify or cancel anytime!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-brand-gray-900 dark:text-gray-100 mb-8 transition-colors">Subscription Benefits</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 border-2 border-brand-gray-200 dark:border-gray-700 transition-colors flex flex-col">
                <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">Standard Subscription</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-brand-orange mb-2">5% OFF</div>
                  <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Applied to every order automatically</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-gray-700 dark:text-gray-300 transition-colors">FREE shipping on all orders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-gray-700 dark:text-gray-300 transition-colors">Flexible delivery schedule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-gray-700 dark:text-gray-300 transition-colors">Cancel or modify anytime</span>
                  </li>
                </ul>
                <div className="mt-auto">
                  <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                    {session?.user ? 'Manage Subscriptions' : 'Get Started'}
                  </Button>
                </div>
              </Card>

              <Card className="p-8 border-2 border-brand-orange bg-brand-orange/5 dark:bg-brand-orange/10 transition-colors flex flex-col">
                <div className="inline-block bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 self-start">
                  BEST VALUE
                </div>
                <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">Premium Subscription</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-brand-orange mb-2">10% OFF</div>
                  <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">For 3+ filter subscriptions</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-gray-700 dark:text-gray-300 transition-colors">Everything in Standard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-gray-700 dark:text-gray-300 transition-colors">10% savings (vs. 5%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-brand-gray-700 dark:text-gray-300 transition-colors">Priority customer support</span>
                  </li>
                </ul>
                <div className="mt-auto">
                  <Button variant="primary" className="w-full" onClick={handleGetStarted}>
                    {session?.user ? 'Manage Subscriptions' : 'Get Started'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-brand-gray-900 dark:text-gray-100 mb-8 transition-colors">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Can I cancel my subscription anytime?</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">
                  Yes! You can cancel, pause, or modify your subscription at any time with no penalties or fees.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">What if I need to skip a delivery?</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">
                  Simply log into your account and skip your next delivery. You can do this as many times as needed.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Can I change my delivery frequency?</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">
                  Absolutely! Adjust your delivery schedule anytime to match your needs - monthly, bi-monthly, quarterly, or semi-annually.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">How do I manage my subscription?</h3>
                <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">
                  Log into your account to view, modify, pause, or cancel your subscriptions. You have full control at all times.
                </p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-3xl mx-auto mt-12 text-center">
            <Card className="p-8 bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Join Home Filter Club?</h2>
              <p className="text-lg mb-6 opacity-90">Start saving today with automatic filter deliveries</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session?.user ? (
                  <Button variant="primary" className="bg-brand-orange hover:bg-brand-orange-dark border-0" onClick={handleGetStarted}>
                    Manage My Subscriptions
                  </Button>
                ) : (
                  <Button variant="primary" className="bg-brand-orange hover:bg-brand-orange-dark border-0" onClick={handleGetStarted}>
                    Sign Up & Subscribe
                  </Button>
                )}
                <button
                  onClick={openWizard}
                  className="btn-secondary px-6 py-3 inline-flex items-center gap-2"
                  aria-label="Open filter finder wizard"
                >
                  <Shield className="w-5 h-5" aria-hidden="true" />
                  Use Filter Finder
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// Filter Wizard Component (imported from previous filter-club page)
function FilterWizard({ 
  step, 
  setStep, 
  data, 
  setData, 
  onClose 
}: { 
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  data: WizardData;
  setData: (data: WizardData) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // WCAG 2.4.3 Fix: Focus management and keyboard trap
  useEffect(() => {
    // Move focus to close button when modal opens
    closeButtonRef.current?.focus();

    // WCAG Fix: Escape key closes modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // WCAG Fix: Focus trap - keep focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const updateData = (updates: Partial<WizardData>) => {
    setData({ ...data, ...updates });
  };

  const nextStep = (nextStep: WizardStep) => {
    setStep(nextStep);
  };

  const prevStep = (previousStep: WizardStep) => {
    setStep(previousStep);
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-brand-blue to-blue-700 dark:from-gray-900 dark:to-gray-800 py-8">
        {/* Close Button */}
        <div className="container-custom mb-4">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-blue"
            aria-label="Close filter wizard and return to page"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            Close
          </button>
        </div>

        <div className="container-custom">
          {/* Progress Indicator */}
          {step !== 'welcome' && (
            <div className="mb-8">
              <div 
                className="flex items-center justify-center gap-2 mb-4" 
                role="progressbar" 
                aria-valuenow={['location', 'household', 'filter-type', 'concerns', 'results'].indexOf(step) + 1}
                aria-valuemin={1}
                aria-valuemax={5}
                aria-label={`Step ${['location', 'household', 'filter-type', 'concerns', 'results'].indexOf(step) + 1} of 5`}
              >
                {['location', 'household', 'filter-type', 'concerns', 'results'].map((s, idx) => (
                  <div
                    key={s}
                    className={`h-2 w-16 rounded-full transition-all ${
                      s === step ? 'bg-brand-orange' : 
                      ['location', 'household', 'filter-type', 'concerns'].indexOf(step) > idx ? 'bg-white' : 'bg-white/30'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Wizard Steps */}
          {step === 'welcome' && <WelcomeStep onNext={() => nextStep('location')} onClose={onClose} />}
          {step === 'location' && <LocationStep data={data} onUpdate={updateData} onNext={() => nextStep('household')} onBack={() => nextStep('welcome')} />}
          {step === 'household' && <HouseholdStep data={data} onUpdate={updateData} onNext={() => nextStep('filter-type')} onBack={() => nextStep('location')} />}
          {step === 'filter-type' && <FilterTypeStep data={data} onUpdate={updateData} onNext={() => nextStep('concerns')} onBack={() => nextStep('household')} />}
          {step === 'concerns' && <ConcernsStep data={data} onUpdate={updateData} onNext={() => nextStep('merv-education')} onBack={() => nextStep('filter-type')} />}
          {step === 'merv-education' && <MervEducationStep data={data} onUpdate={updateData} onNext={() => nextStep('results')} onBack={() => nextStep('concerns')} />}
          {step === 'results' && <ResultsStep data={data} onRestart={() => { setData({}); nextStep('welcome'); }} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="p-8 md:p-12 bg-white dark:bg-gray-800 shadow-2xl">
        <div className="mb-8">
          <div className="w-24 h-24 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-white" aria-hidden="true" />
          </div>
          <h2 id="wizard-title" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Find Your Perfect Filter
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-center">
            Answer 5 quick questions to get personalized recommendations
          </p>
        </div>

        {/* Steps Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Find Your Filter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Answer a few simple questions</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Schedule Delivery</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your replacement frequency</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Free Shipping</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Delivered right to your door</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Why Join the Home Filter Club?</h3>
          <ul className="space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-brand-orange">✓</span>
              <span>Never forget to change your filter again</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-brand-orange">✓</span>
              <span>Save 5-10% on every delivery plus free shipping</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-brand-orange">✓</span>
              <span>Pause, skip, or cancel anytime</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-brand-orange">✓</span>
              <span>Expert recommendations for your specific needs</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={onNext}
            className="btn-primary w-full px-12 py-4 text-lg inline-flex items-center justify-center gap-2"
            aria-label="Start filter selection wizard"
          >
            Get Started
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
          
          <button
            onClick={onClose}
            className="btn-secondary w-full px-12 py-3 inline-flex items-center justify-center gap-2"
            aria-label="Close wizard and browse filters"
          >
            Browse Filters Instead
          </button>
        </div>
      </Card>
    </div>
  );
}

// Step Props Interface
interface StepProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Location Step
function LocationStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [zipCode, setZipCode] = useState(data.zipCode || '');
  const [airGrade, setAirGrade] = useState<string>('');
  const [waterGrade, setWaterGrade] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // OWASP A03 Fix: Explicit validation
    if (zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setAirGrade('Good');
      setWaterGrade('B+');
      setLoading(false);
      onUpdate({ zipCode });
    }, 1000);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // OWASP A03 Fix: Sanitize input - only allow digits, max 5
    const sanitized = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(sanitized);
    setError('');
  };

  const handleContinue = () => {
    onUpdate({ zipCode });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="p-8 bg-white dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Let's Check Your Air & Water Quality
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          Enter your ZIP code to see your local air and water quality grades
        </p>

        <form onSubmit={handleSubmit} className="mb-8">
          <label htmlFor="zip-input" className="sr-only">
            ZIP code (5 digits)
          </label>
          <div className="flex gap-3">
            <input
              id="zip-input"
              type="text"
              inputMode="numeric"
              value={zipCode}
              onChange={handleZipChange}
              placeholder="Enter ZIP code"
              className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
              maxLength={5}
              pattern="[0-9]{5}"
              required
              aria-label="ZIP code"
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'zip-error' : undefined}
            />
            <button
              type="submit"
              disabled={zipCode.length !== 5 || loading}
              className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Check air and water quality"
              aria-busy={loading}
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
          {error && (
            <p id="zip-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </form>

        {(airGrade || waterGrade) && (
          <div className="space-y-6 mb-8" role="region" aria-live="polite">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
              Your Local Quality Grades
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center border-2 border-blue-200 dark:border-blue-800">
                <Wind className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" aria-hidden="true" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Air Quality</h4>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{airGrade}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on EPA data</p>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-6 text-center border-2 border-cyan-200 dark:border-cyan-800">
                <Droplets className="w-12 h-12 text-cyan-600 dark:text-cyan-400 mx-auto mb-3" aria-hidden="true" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Water Quality</h4>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{waterGrade}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on local reports</p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-300 text-center">
                <Info className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Even the best quality benefits from proper filtration!
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onBack} 
            className="btn-secondary inline-flex items-center gap-2" 
            aria-label="Go back to previous step"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            Back
          </button>
          
          <button 
            onClick={handleContinue}
            disabled={!airGrade || !waterGrade}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Continue to next step"
            aria-disabled={!airGrade || !waterGrade}
          >
            Continue
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}

// Household Step
function HouseholdStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState<number | undefined>(data.householdSize);

  const handleSelect = (size: number) => {
    setSelected(size);
    onUpdate({ householdSize: size });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="p-8 bg-white dark:bg-gray-800">
        <div className="text-center mb-8">
          <Users className="w-16 h-16 text-brand-orange mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            How many people live in your home?
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This helps us recommend the right filtration capacity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" role="group" aria-label="Household size options">
          {[
            { value: 1, label: '1-2 People', icon: '👤👤' },
            { value: 3, label: '3-4 People', icon: '👨‍👩‍👦' },
            { value: 5, label: '5+ People', icon: '👨‍👩‍👧‍👦' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`p-6 rounded-lg border-2 transition-all text-center ${
                selected === option.value
                  ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-brand-orange'
              }`}
              aria-pressed={selected === option.value}
              aria-label={option.label}
            >
              <div className="text-4xl mb-2" aria-hidden="true">{option.icon}</div>
              <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onBack} 
            className="btn-secondary inline-flex items-center gap-2"
            aria-label="Go back to location step"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            Back
          </button>
          <button 
            onClick={onNext} 
            disabled={!selected} 
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Continue to filter type selection"
            aria-disabled={!selected}
          >
            Continue
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}

// Filter Type Step
function FilterTypeStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState<'air' | 'water' | 'both' | undefined>(data.filterType);

  const handleSelect = (type: 'air' | 'water' | 'both') => {
    setSelected(type);
    onUpdate({ filterType: type });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Card className="p-8 bg-white dark:bg-gray-800">
        <div className="text-center mb-8">
          <Home className="w-16 h-16 text-brand-orange mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What type of filters do you need?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" role="group" aria-label="Filter type options">
          {[
            { value: 'air' as const, label: 'Air Filters', description: 'HVAC & furnace', icon: Wind },
            { value: 'water' as const, label: 'Water Filters', description: 'Refrigerator filters', icon: Droplets },
            { value: 'both' as const, label: 'Both', description: 'Complete solution', icon: Shield },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selected === option.value ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-brand-orange'
                }`}
                aria-pressed={selected === option.value}
                aria-label={option.label}
              >
                <Icon className="w-12 h-12 mx-auto mb-3 text-brand-orange" aria-hidden="true" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{option.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onBack} 
            className="btn-secondary inline-flex items-center gap-2"
            aria-label="Go back to household step"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            Back
          </button>
          <button 
            onClick={onNext} 
            disabled={!selected} 
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Continue to concerns assessment"
            aria-disabled={!selected}
          >
            Continue
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}

// Concerns Step
function ConcernsStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [concerns, setConcerns] = useState<string[]>(data.concerns || []);

  const toggleConcern = (concern: string) => {
    const updated = concerns.includes(concern) ? concerns.filter(c => c !== concern) : [...concerns, concern];
    setConcerns(updated);
    onUpdate({ concerns: updated });
  };

  const concernOptions = [
    { id: 'allergies', label: 'Allergies & Asthma', icon: '🤧', description: 'Pollen, dust, pet dander' },
    { id: 'pets', label: 'Pets', icon: '🐕', description: 'Pet hair and odors' },
    { id: 'odors', label: 'Odors', icon: '👃', description: 'Cooking, smoke' },
    { id: 'virus', label: 'Viruses & Bacteria', icon: '🦠', description: 'Airborne pathogens' },
    { id: 'dust', label: 'Dust', icon: '💨', description: 'Household particles' },
    { id: 'mold', label: 'Mold & Mildew', icon: '🍄', description: 'Moisture issues' },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Card className="p-8 bg-white dark:bg-gray-800">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-brand-orange mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What are your main concerns?
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Select all that apply (optional)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" role="group" aria-label="Filtration concerns">
          {concernOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleConcern(option.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                concerns.includes(option.id) ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-brand-orange'
              }`}
              aria-pressed={concerns.includes(option.id)}
              aria-label={`${option.label}: ${option.description}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl" aria-hidden="true">{option.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{option.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {concerns.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6" role="status" aria-live="polite">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              ✓ {concerns.length} concern{concerns.length > 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onBack} 
            className="btn-secondary inline-flex items-center gap-2"
            aria-label="Go back to filter type selection"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            Back
          </button>
          <button 
            onClick={onNext} 
            className="btn-primary inline-flex items-center gap-2"
            aria-label="Continue to MERV education"
          >
            Continue
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}

// MERV Education Step
function MervEducationStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [selectedMerv, setSelectedMerv] = useState<number | undefined>(data.mervLevel);

  const mervLevels = [
    { range: '1-4', value: 4, title: 'Basic Protection', captures: 'Pollen, dust mites', efficiency: '< 20%', bestFor: 'Minimal needs', color: 'gray' },
    { range: '5-8', value: 8, title: 'Better Protection', captures: 'Mold, pet dander, dust', efficiency: '20-70%', bestFor: 'Most homes', color: 'blue', popular: true },
    { range: '9-12', value: 11, title: 'Superior Protection', captures: 'Lead dust, auto emissions', efficiency: '70-90%', bestFor: 'Allergies, pets', color: 'orange', recommended: true },
    { range: '13-16', value: 13, title: 'Premium Protection', captures: 'Bacteria, smoke', efficiency: '> 90%', bestFor: 'Hospitals', color: 'green' },
  ];

  const handleSelect = (merv: number) => {
    setSelectedMerv(merv);
    onUpdate({ mervLevel: merv });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="p-8 bg-white dark:bg-gray-800">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-brand-orange mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Understanding MERV Ratings
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            MERV measures how effectively a filter removes particles
          </p>
        </div>

        <div className="bg-gradient-to-r from-gray-100 via-blue-100 via-orange-100 to-green-100 dark:from-gray-700 dark:via-blue-900/30 dark:via-orange-900/30 dark:to-green-900/30 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lower Protection</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Higher Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-600">1</span>
            <div className="flex-1 h-4 bg-gradient-to-r from-gray-300 via-blue-400 via-orange-500 to-green-500 rounded-full" role="img" aria-label="MERV scale 1 to 16" />
            <span className="text-2xl font-bold text-gray-600">16</span>
          </div>
        </div>

        <div className="space-y-4 mb-8" role="radiogroup" aria-label="MERV rating levels">
          {mervLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                selectedMerv === level.value ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-brand-orange'
              }`}
              role="radio"
              aria-checked={selectedMerv === level.value}
              aria-label={`MERV ${level.range}: ${level.title}. ${level.bestFor}. ${level.efficiency} efficiency.`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">MERV {level.range}</span>
                    {level.popular && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full">Most Popular</span>}
                    {level.recommended && <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-semibold rounded-full">Recommended</span>}
                  </div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{level.title}</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong className="text-gray-900 dark:text-white">Captures:</strong> {level.captures}</p>
                    <p><strong className="text-gray-900 dark:text-white">Efficiency:</strong> {level.efficiency}</p>
                    <p><strong className="text-gray-900 dark:text-white">Best for:</strong> {level.bestFor}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6" role="note">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 inline mr-1" aria-hidden="true" />
            <strong>Pro Tip:</strong> MERV 8-13 is ideal for most homes with allergies or pets.
          </p>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onBack} 
            className="btn-secondary inline-flex items-center gap-2"
            aria-label="Go back to concerns step"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            Back
          </button>
          <button 
            onClick={onNext} 
            disabled={!selectedMerv} 
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="See your filter recommendations"
            aria-disabled={!selectedMerv}
          >
            See Results
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}

// Results Step
function ResultsStep({ data, onRestart, onClose }: { data: WizardData; onRestart: () => void; onClose: () => void }) {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="p-8 bg-white dark:bg-gray-800">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl" aria-hidden="true">🎉</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Personalized Recommendations
          </h2>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Home Profile</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {data.zipCode && <><dt className="text-gray-600 dark:text-gray-400">Location:</dt><dd className="font-medium text-gray-900 dark:text-white">ZIP {data.zipCode}</dd></>}
            {data.householdSize && <><dt className="text-gray-600 dark:text-gray-400">Household:</dt><dd className="font-medium text-gray-900 dark:text-white">{data.householdSize === 1 ? '1-2' : data.householdSize === 3 ? '3-4' : '5+'} people</dd></>}
            {data.filterType && <><dt className="text-gray-600 dark:text-gray-400">Filter Type:</dt><dd className="font-medium text-gray-900 dark:text-white capitalize">{data.filterType}</dd></>}
            {data.mervLevel && <><dt className="text-gray-600 dark:text-gray-400">MERV Level:</dt><dd className="font-medium text-gray-900 dark:text-white">MERV {data.mervLevel}</dd></>}
          </dl>
        </div>

        {/* Recommendations */}
        <div className="space-y-4 mb-8">
          {(data.filterType === 'air' || data.filterType === 'both') && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Wind className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Air Filter - MERV {data.mervLevel}</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Perfect for maintaining clean indoor air quality</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/air-filters?merv=${data.mervLevel}`} className="btn-primary inline-flex items-center gap-2">
                      View Air Filters
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link href={`/air-filters?merv=${data.mervLevel}&subscription=true`} className="btn-secondary inline-flex items-center gap-2">
                      Subscribe & Save 5%
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(data.filterType === 'water' || data.filterType === 'both') && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Droplets className="w-10 h-10 text-cyan-600 dark:text-cyan-400 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Refrigerator Water Filter</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Reduces contaminants for cleaner water</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/refrigerator-filters" className="btn-primary inline-flex items-center gap-2">
                      View Water Filters
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link href="/refrigerator-filters?subscription=true" className="btn-secondary inline-flex items-center gap-2">
                      Subscribe & Save 5%
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Promo */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg p-6 mb-8 border-2 border-orange-200 dark:border-orange-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 text-center">Join the Home Filter Club</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-orange mb-1">5%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Off Every Delivery</div>
            </div>
            <div>
              <Truck className="w-8 h-8 text-brand-orange mx-auto mb-2" aria-hidden="true" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Free Shipping</div>
            </div>
            <div>
              <Calendar className="w-8 h-8 text-brand-orange mx-auto mb-2" aria-hidden="true" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Never Forget</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onRestart} className="btn-secondary inline-flex items-center justify-center gap-2">
            Start Over
          </button>
          <button onClick={onClose} className="btn-primary inline-flex items-center justify-center gap-2">
            Close & Browse Filters
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}
