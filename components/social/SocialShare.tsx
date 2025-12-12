'use client';

/**
 * Social Share Component
 * 
 * Provides social sharing buttons for multiple platforms
 * 
 * WCAG Compliant:
 * - Proper ARIA labels for all buttons
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Focus management for dropdown
 * - Screen reader announcements
 * - Semantic HTML
 */

import { useState, useEffect, useRef } from 'react';
import { SocialShareData, SocialPlatform } from '@/lib/types/referral';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  MessageCircle, 
  Copy, 
  Check,
  Share2 
} from 'lucide-react';

interface SocialShareProps {
  data: SocialShareData;
  shareType?: 'product' | 'referral' | 'order' | 'general';
  productId?: string;
  referralCode?: string;
  className?: string;
  showLabels?: boolean;
  variant?: 'buttons' | 'icons' | 'dropdown';
}

export default function SocialShare({
  data,
  shareType = 'general',
  productId,
  referralCode,
  className = '',
  showLabels = false,
  variant = 'icons'
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Track share via API
  const trackShare = async (platform: SocialPlatform) => {
    try {
      await fetch('/api/social-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          share_type: shareType,
          share_platform: platform,
          shared_url: data.url,
          product_id: productId,
          referral_code: referralCode
        })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  // Generate share URLs
  const getShareUrl = (platform: SocialPlatform): string => {
    const encodedUrl = encodeURIComponent(data.url);
    const encodedTitle = encodeURIComponent(data.title);
    const encodedDesc = encodeURIComponent(data.description);
    const hashtags = data.hashtags?.join(',') || '';

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtags ? `&hashtags=${hashtags}` : ''}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`;
      default:
        return data.url;
    }
  };

  // Handle share click
  const handleShare = async (platform: SocialPlatform) => {
    await trackShare(platform);

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    } else {
      const url = getShareUrl(platform);
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }

    if (variant === 'dropdown') {
      setIsDropdownOpen(false);
      buttonRef.current?.focus(); // Return focus to button
    }
  };

  // Keyboard navigation for dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Try native Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        });
        await trackShare('copy'); // Track as generic share
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  // Share buttons configuration
  const shareButtons = [
    { 
      platform: 'facebook' as SocialPlatform, 
      icon: Facebook, 
      label: 'Facebook', 
      color: 'hover:bg-blue-600',
      bgColor: 'bg-blue-500'
    },
    { 
      platform: 'twitter' as SocialPlatform, 
      icon: Twitter, 
      label: 'X (Twitter)', 
      color: 'hover:bg-gray-800',
      bgColor: 'bg-black'
    },
    { 
      platform: 'linkedin' as SocialPlatform, 
      icon: Linkedin, 
      label: 'LinkedIn', 
      color: 'hover:bg-blue-700',
      bgColor: 'bg-blue-600'
    },
    { 
      platform: 'whatsapp' as SocialPlatform, 
      icon: MessageCircle, 
      label: 'WhatsApp', 
      color: 'hover:bg-green-600',
      bgColor: 'bg-green-500'
    },
    { 
      platform: 'email' as SocialPlatform, 
      icon: Mail, 
      label: 'Email', 
      color: 'hover:bg-gray-600',
      bgColor: 'bg-gray-500'
    },
    { 
      platform: 'copy' as SocialPlatform, 
      icon: copied ? Check : Copy, 
      label: copied ? 'Copied!' : 'Copy Link', 
      color: 'hover:bg-gray-600',
      bgColor: 'bg-gray-500'
    }
  ];

  // Render as dropdown
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          aria-label="Share options"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
          <span>Share</span>
        </button>

        {isDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
              aria-hidden="true"
            />
            <div 
              role="menu"
              aria-label="Share options menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {navigator.share && (
                <>
                  <button
                    onClick={handleNativeShare}
                    role="menuitem"
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors focus:outline-none focus:bg-gray-100"
                    aria-label="Share using device share menu"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-700">Share via...</span>
                  </button>
                  <div className="border-t border-gray-200 my-2" role="separator" />
                </>
              )}
              
              {shareButtons.map(({ platform, icon: Icon, label }) => (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  role="menuitem"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors focus:outline-none focus:bg-gray-100"
                  aria-label={`Share on ${label}`}
                >
                  <Icon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Render as icon buttons
  if (variant === 'icons') {
    return (
      <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Share options">
        {navigator.share && (
          <button
            onClick={handleNativeShare}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Share"
            aria-label="Share using device share menu"
          >
            <Share2 className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>
        )}
        
        {shareButtons.map(({ platform, icon: Icon, label }) => (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title={label}
            aria-label={`Share on ${label}`}
          >
            <Icon className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>
        ))}
      </div>
    );
  }

  // Render as full buttons
  return (
    <div className={`flex flex-wrap gap-3 ${className}`} role="group" aria-label="Share options">
      {shareButtons.map(({ platform, icon: Icon, label, bgColor, color }) => (
        <button
          key={platform}
          onClick={() => handleShare(platform)}
          className={`flex items-center gap-2 px-4 py-2 ${bgColor} ${color} text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          aria-label={`Share on ${label}`}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
          {showLabels && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}

