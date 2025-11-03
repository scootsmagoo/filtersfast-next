export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    slug: string;
  };
  publishedAt: string;
  updatedAt?: string;
  category: BlogCategory;
  tags?: string[];
  featuredImage?: string;
  commentsCount?: number;
}

export type BlogCategory = 
  | 'water' 
  | 'air' 
  | 'buyers-guides' 
  | 'business' 
  | 'just-for-you' 
  | 'general';

export interface BlogCategoryInfo {
  slug: BlogCategory;
  title: string;
  description: string;
}

export const blogCategories: Record<BlogCategory, BlogCategoryInfo> = {
  'water': {
    slug: 'water',
    title: 'Water Filtration',
    description: 'Everything you need to know about water filtration, from refrigerator filters to whole house systems.',
  },
  'air': {
    slug: 'air',
    title: 'Air Filtration',
    description: 'Learn about air quality, HVAC filters, air purifiers, and keeping your indoor air clean.',
  },
  'buyers-guides': {
    slug: 'buyers-guides',
    title: 'Buyer\'s Guides',
    description: 'Expert guides to help you choose the right filtration solution for your needs.',
  },
  'business': {
    slug: 'business',
    title: 'Business Owners',
    description: 'Resources and information for business owners looking for filtration solutions.',
  },
  'just-for-you': {
    slug: 'just-for-you',
    title: 'Just For You',
    description: 'Personalized tips, tricks, and information tailored to your filtration needs.',
  },
  'general': {
    slug: 'general',
    title: 'General',
    description: 'General filtration news, tips, and information.',
  },
};

