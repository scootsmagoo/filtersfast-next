/**
 * Partner Landing Page Types
 * 
 * Supports charity partners, corporate partners, and special discount programs
 */

export type PartnerType = 'charity' | 'corporate' | 'discount_program';

export type ContentBlockType = 
  | 'hero'
  | 'text'
  | 'stats'
  | 'image_gallery'
  | 'timeline'
  | 'cta'
  | 'video'
  | 'perks';

/**
 * Individual content block for flexible page building
 */
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  data: Record<string, any>; // Flexible data structure based on block type
}

/**
 * Partner organization/company
 */
export interface Partner {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier (e.g., 'habitat-for-humanity')
  type: PartnerType;
  
  // Basic Info
  shortDescription: string; // Used in listings
  description?: string; // Full description
  logo?: string; // Logo URL or path
  heroImage?: string; // Main hero/banner image
  
  // Partnership Details
  partnershipStartDate?: Date;
  missionStatement?: string;
  websiteUrl?: string;
  
  // For Corporate/Discount Partners
  discountCode?: string; // Auto-apply discount code
  discountDescription?: string;
  
  // Meta & SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Content Blocks
  contentBlocks: ContentBlock[];
  
  // Status
  active: boolean;
  featured: boolean;
  displayOrder: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content block templates with expected data structure
 */

export interface HeroBlockData {
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface TextBlockData {
  heading?: string;
  content: string;
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

export interface StatsBlockData {
  stats: Array<{
    number: string;
    label: string;
    icon?: string;
  }>;
  backgroundColor?: string;
  textColor?: string;
}

export interface ImageGalleryBlockData {
  images: Array<{
    url: string;
    caption?: string;
    alt: string;
  }>;
  layout?: 'grid' | 'carousel' | 'masonry';
}

export interface TimelineBlockData {
  events: Array<{
    year: string;
    season?: string;
    title: string;
    description: string;
  }>;
}

export interface CTABlockData {
  heading: string;
  description?: string;
  buttons: Array<{
    text: string;
    url: string;
    variant?: 'primary' | 'secondary';
    external?: boolean;
  }>;
  backgroundColor?: string;
}

export interface VideoBlockData {
  videoUrl: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface PerksBlockData {
  title?: string;
  perks: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
  backgroundColor?: string;
  columns?: number;
}

/**
 * Partner creation/update payload
 */
export interface CreatePartnerInput {
  name: string;
  slug: string;
  type: PartnerType;
  shortDescription: string;
  description?: string;
  logo?: string;
  heroImage?: string;
  partnershipStartDate?: Date;
  missionStatement?: string;
  websiteUrl?: string;
  discountCode?: string;
  discountDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  contentBlocks?: ContentBlock[];
  active: boolean;
  featured: boolean;
  displayOrder: number;
}

export interface UpdatePartnerInput extends Partial<CreatePartnerInput> {
  id: string;
}

/**
 * Partner stats and analytics
 */
export interface PartnerStats {
  partnerId: string;
  partnerName: string;
  views: number;
  discountUses?: number; // For corporate partners
  periodStart: Date;
  periodEnd: Date;
}

