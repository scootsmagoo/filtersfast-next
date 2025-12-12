'use client';

/**
 * Public Giveaway Entry Page
 * 
 * Shows all active giveaways and allows users to enter
 */

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Gift, Calendar, Users, Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface GiveawayStatus {
  status: 'upcoming' | 'active' | 'ended';
  daysRemaining?: number;
  hasEntered?: boolean;
  canEnter: boolean;
}

interface PublicGiveaway {
  id: number;
  campaignName: string;
  title: string;
  description: string;
  productName: string | null;
  productUrl: string | null;
  productImageUrl: string | null;
  prizeDescription: string;
  startDate: string;
  endDate: string;
  entryCount: number;
  status: GiveawayStatus;
}

export default function GiveawayPage() {
  const [giveaways, setGiveaways] = useState<PublicGiveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGiveaway, setSelectedGiveaway] = useState<PublicGiveaway | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);

  useEffect(() => {
    fetchGiveaways();
  }, []);

  async function fetchGiveaways() {
    try {
      const res = await fetch('/api/giveaways/active');
      const data = await res.json();
      
      if (data.success) {
        setGiveaways(data.giveaways);
      }
    } catch (error) {
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  }

  function openEntryForm(giveaway: PublicGiveaway) {
    setSelectedGiveaway(giveaway);
    setShowEntryForm(true);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center" role="status" aria-live="polite">
          <span className="sr-only">Loading giveaways...</span>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="progressbar">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Gift className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Win Amazing Prizes!</h1>
          <p className="text-xl text-orange-100 max-w-2xl mx-auto">
            Enter our giveaways for your chance to win filters, gift cards, and more! No purchase necessary.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {giveaways.length === 0 ? (
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Active Giveaways</h2>
            <p className="text-gray-600 mb-6">
              Check back soon for upcoming contests and giveaways!
            </p>
            <Link href="/">
              <Button className="btn-primary">Shop FiltersFast</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-8">
            {giveaways.map((giveaway) => (
              <Card key={giveaway.id} className="overflow-hidden">
                <div className="md:flex">
                  {/* Image Section */}
                  {giveaway.productImageUrl && (
                    <div className="md:w-1/3 bg-gray-100 flex items-center justify-center p-8">
                      <img
                        src={giveaway.productImageUrl}
                        alt={giveaway.productName || giveaway.title}
                        className="max-w-full max-h-64 object-contain"
                      />
                    </div>
                  )}

                  {/* Content Section */}
                  <div className={`${giveaway.productImageUrl ? 'md:w-2/3' : 'w-full'} p-8`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{giveaway.title}</h2>
                        {giveaway.status.status === 'active' && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active • {giveaway.status.daysRemaining} {giveaway.status.daysRemaining === 1 ? 'day' : 'days'} left
                          </div>
                        )}
                      </div>
                      {giveaway.status.hasEntered && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                          <Award className="w-5 h-5" />
                          <span className="font-medium">You're Entered!</span>
                        </div>
                      )}
                    </div>

                    <p className="text-lg text-gray-700 mb-4">{giveaway.description}</p>

                    {/* Prize Section */}
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-900">Prize:</h3>
                      </div>
                      <p className="text-orange-800">{giveaway.prizeDescription}</p>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <div>
                          <div className="text-xs text-gray-500">Ends</div>
                          <div className="font-medium">{new Date(giveaway.endDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-5 h-5" />
                        <div>
                          <div className="text-xs text-gray-500">Entries</div>
                          <div className="font-medium">{giveaway.entryCount.toLocaleString()}</div>
                        </div>
                      </div>
                      {giveaway.productUrl && (
                        <div className="flex items-center gap-2">
                          <a
                            href={giveaway.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            View Product
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                      {giveaway.status.canEnter && !giveaway.status.hasEntered ? (
                        <Button
                          onClick={() => openEntryForm(giveaway)}
                          className="btn-primary"
                          aria-label={`Enter ${giveaway.title} giveaway`}
                        >
                          Enter Giveaway
                        </Button>
                      ) : giveaway.status.hasEntered ? (
                        <Button 
                          disabled 
                          className="btn-secondary cursor-not-allowed"
                          aria-label="You have already entered this giveaway"
                          aria-disabled="true"
                        >
                          Already Entered
                        </Button>
                      ) : (
                        <Button 
                          disabled 
                          className="btn-secondary cursor-not-allowed"
                          aria-disabled="true"
                          aria-label={giveaway.status.status === 'ended' ? 'This giveaway has ended' : 'This giveaway has not started yet'}
                        >
                          {giveaway.status.status === 'ended' ? 'Giveaway Ended' : 'Coming Soon'}
                        </Button>
                      )}
                      <Link href="/sweepstakes">
                        <Button className="btn-secondary">Official Rules</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">
            <strong>No purchase necessary to enter or win.</strong>
          </p>
          <p>
            Winners will be selected randomly and notified by email.{' '}
            <Link href="/sweepstakes" className="text-blue-600 hover:underline">
              See official rules
            </Link>
            {' '}for complete details.
          </p>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && selectedGiveaway && (
        <GiveawayEntryForm
          giveaway={selectedGiveaway}
          onClose={() => {
            setShowEntryForm(false);
            setSelectedGiveaway(null);
          }}
          onSuccess={() => {
            fetchGiveaways();
            setShowEntryForm(false);
            setSelectedGiveaway(null);
          }}
        />
      )}
    </div>
  );
}

// Entry Form Modal Component
function GiveawayEntryForm({
  giveaway,
  onClose,
  onSuccess
}: {
  giveaway: PublicGiveaway;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    recaptchaToken: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load reCAPTCHA
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await (window as any).grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action: 'giveaway_entry' }
      );

      const res = await fetch('/api/giveaways/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          giveawayId: giveaway.id,
          recaptchaToken
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('🎉 ' + data.message);
        onSuccess();
      } else {
        setError(data.error || 'Failed to submit entry');
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      setError('Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="giveaway-modal-title"
    >
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 id="giveaway-modal-title" className="text-2xl font-bold text-gray-900">Enter Giveaway</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close giveaway entry form"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-900 mb-1">{giveaway.title}</h3>
            <p className="text-sm text-orange-800">{giveaway.prizeDescription}</p>
          </div>

          {error && (
            <div 
              role="alert" 
              aria-live="assertive"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="giveaway-firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-600" aria-label="required">*</span>
            </label>
            <input
              id="giveaway-firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              aria-required="true"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input-field"
              placeholder="Enter your first name"
              aria-describedby={error ? "form-error" : undefined}
            />
          </div>

          <div>
            <label htmlFor="giveaway-lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-600" aria-label="required">*</span>
            </label>
            <input
              id="giveaway-lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              aria-required="true"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input-field"
              placeholder="Enter your last name"
              aria-describedby={error ? "form-error" : undefined}
            />
          </div>

          <div>
            <label htmlFor="giveaway-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-600" aria-label="required">*</span>
            </label>
            <input
              id="giveaway-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-required="true"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="your@email.com"
              aria-describedby={error ? "form-error" : undefined}
            />
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            By entering, you agree to our{' '}
            <Link href="/sweepstakes" className="text-blue-600 hover:underline">
              official rules
            </Link>{' '}
            and may receive promotional emails from FiltersFast (you can unsubscribe anytime).
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              disabled={submitting} 
              className="btn-primary flex-1"
              aria-busy={submitting}
              aria-label={submitting ? 'Submitting your giveaway entry' : 'Enter giveaway'}
            >
              {submitting ? 'Submitting...' : 'Enter Giveaway'}
            </Button>
            <Button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
              aria-label="Cancel and close form"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{' '}
            apply.
          </div>
        </form>
      </div>
    </div>
  );
}

