# Development Guide - FiltersFast Next.js

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **npm, yarn, or pnpm** package manager

### Installation

```bash
# Navigate to project directory
cd C:\Users\adam\source\repos\FiltersFast-Next

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure Explained

### `/app` - Next.js App Router

The `app` directory uses Next.js 14's new App Router:

- **`layout.tsx`** - Root layout (wraps all pages with Header/Footer)
- **`page.tsx`** - Homepage component
- **`globals.css`** - Global styles + Tailwind directives
- **`/refrigerator-filters/page.tsx`** - Product listing page example

Each folder in `/app` becomes a route automatically.

### `/components` - React Components

Organized by purpose:

#### `/components/ui` - Primitive UI Components
- **`Button.tsx`** - Reusable button with variants (primary, secondary, outline, ghost)
- **`Card.tsx`** - Content card wrapper with hover effects

#### `/components/layout` - Layout Components
- **`Header.tsx`** - Site header with navigation, search, cart
- **`Footer.tsx`** - Site footer with links, social media

#### `/components/home` - Homepage Sections
- **`HeroSection.tsx`** - Hero banner with CTAs
- **`FilterTools.tsx`** - Interactive filter finder (water/air)
- **`FeaturedCategories.tsx`** - Category grid
- **`HomeFilterClub.tsx`** - Subscription promotion
- **`TrustIndicators.tsx`** - Social proof, reviews, guarantees

#### `/components/products` - Product-Related Components
- **`ProductGrid.tsx`** - Product listing with sorting/filtering
- **`ProductCard.tsx`** - Individual product display (grid/list views)
- **`FilterSidebar.tsx`** - Filter sidebar with collapsible sections

### `/lib` - Utility Functions

- **`utils.ts`** - Helper functions (className merger, price formatting, etc.)

## 🎨 Styling with Tailwind CSS

### Why Tailwind?

Replaces the 4,000+ line CSS files with utility classes:

```tsx
// Before (Traditional CSS)
<div className="product-card">...</div>

// After (Tailwind)
<div className="rounded-lg shadow-md hover:shadow-xl transition-shadow">...</div>
```

### Brand Colors

Defined in `tailwind.config.ts`:

```tsx
// Usage
<div className="bg-brand-orange text-white">
<Button variant="primary"> // Uses brand-orange
```

### Custom Utilities

Defined in `globals.css`:

```css
.btn-primary     → Orange CTA button
.btn-secondary   → Blue action button
.input-field     → Form input styling
.card            → Product/content cards
```

## 🧩 Component Patterns

### Server Components (Default)

```tsx
// No 'use client' directive = Server Component
export default function ProductPage() {
  // Runs on server, can access database directly
  const products = await getProducts();
  return <div>...</div>;
}
```

### Client Components

```tsx
'use client'; // Required for interactivity

export default function FilterSidebar() {
  const [filters, setFilters] = useState([]);
  // Can use hooks, event handlers, browser APIs
}
```

### When to use which?

- **Server Components:** Static content, data fetching, SEO-critical pages
- **Client Components:** Interactive elements (forms, modals, filters)

## 📦 Adding New Pages

### 1. Create Route Folder

```bash
mkdir app/air-filters
```

### 2. Add page.tsx

```tsx
// app/air-filters/page.tsx
export const metadata = {
  title: 'Air Filters | FiltersFast',
  description: '...',
};

export default function AirFiltersPage() {
  return <div>Air Filters Content</div>;
}
```

### 3. Page is Live!

Navigate to `/air-filters` - no routing config needed!

## 🔧 Common Tasks

### Adding a New Component

```tsx
// components/ui/Badge.tsx
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'sale' | 'new';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-brand-blue',
    sale: 'bg-red-500',
    new: 'bg-green-500',
  };
  
  return (
    <span className={cn('px-2 py-1 text-white rounded text-xs', variants[variant])}>
      {children}
    </span>
  );
}
```

### Using the Component

```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="sale">50% OFF</Badge>
```

### Adding Icons

This project uses **Lucide React** for icons:

```tsx
import { Star, ShoppingCart, Search } from 'lucide-react';

<Star className="w-5 h-5 text-yellow-400" />
```

[Browse all icons →](https://lucide.dev/)

## 🔄 State Management

### Local State (useState)

For component-specific state:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

### Future: Global State

When you need shared state (cart, user), consider:

- **Zustand** - Lightweight, simple API
- **React Query** - Server state management
- **Context API** - Built-in React solution

## 🗄️ Data Fetching (Future)

### Server-Side

```tsx
// app/products/[id]/page.tsx
async function getProduct(id: string) {
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <div>{product.name}</div>;
}
```

### Client-Side (with React Query)

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export default function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  
  if (isLoading) return <div>Loading...</div>;
  return <div>...</div>;
}
```

## 🎯 TypeScript Tips

### Type Your Props

```tsx
interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
  };
  onAddToCart: (id: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // TypeScript now knows all prop types!
}
```

### Use Type Inference

```tsx
const products = [
  { id: 1, name: 'Filter', price: 39.99 },
];

// TypeScript infers: Array<{ id: number; name: string; price: number }>
```

## 📧 Newsletter Preferences Setup

### Quick Start

1. **Initialize newsletter_tokens table:**
```bash
npm run init-newsletter
# or
npx tsx scripts/init-newsletter.ts
```

2. **Verify table creation:**
```bash
# The script will output: ✅ Newsletter tokens table initialized
```

### What Gets Created

**newsletter_tokens table:**
- Stores unsubscribe tokens (never expire by law)
- Stores preference management tokens (24-hour expiry)
- Indexed for fast lookups
- Foreign key to user table (cascade delete)

### Environment Variables

Add to your `.env.local`:

```env
# Base URL for email links (required for unsubscribe links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Production example:
# NEXT_PUBLIC_BASE_URL=https://www.filtersfast.com
```

### Testing Unsubscribe Flow

1. **Generate a token (in code):**
```typescript
import { createNewsletterToken } from '@/lib/db/newsletter-tokens';

const token = createNewsletterToken(
  userId,
  userEmail,
  'unsubscribe',
  null  // Never expires
);

console.log(`Unsubscribe URL: http://localhost:3000/unsubscribe/${token}`);
```

2. **Test the unsubscribe page:**
- Navigate to `/unsubscribe/[token]`
- Should show confirmation screen
- Click "Yes, Unsubscribe Me"
- Verify preferences updated in database

### Email Integration

**Using email templates:**

```typescript
import { createNewsletterEmail, createReminderEmail } from '@/lib/email-templates/newsletter';

// Newsletter email
const newsletter = await createNewsletterEmail({
  userId: user.id,
  email: user.email,
  subject: 'Spring Sale - 20% Off All Filters!',
  heading: 'Spring Cleaning Sale',
  content: '<p>Get 20% off all filters this week only!</p>',
  ctaText: 'Shop Now',
  ctaUrl: 'https://www.filtersfast.com/sale',
});

// Send via your email service
await sendEmail({
  to: user.email,
  subject: newsletter.subject,
  html: newsletter.html,
});
```

### GDPR/CAN-SPAM Compliance Checklist

**Before sending marketing emails:**

- [ ] Initialize newsletter_tokens table
- [ ] Set NEXT_PUBLIC_BASE_URL environment variable
- [ ] Test unsubscribe links work
- [ ] Verify unsubscribe footer appears in emails
- [ ] Check physical address in email footer
- [ ] Test on mobile devices
- [ ] Verify audit logging is active

---

## 🚀 Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/products/filter.jpg"
  alt="Water Filter"
  width={300}
  height={300}
  className="rounded-lg"
/>
```

Next.js automatically:
- Optimizes images (WebP, AVIF)
- Lazy loads images
- Prevents layout shift

### Code Splitting

Next.js automatically splits code by route. For extra optimization:

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

## 🐛 Debugging

### React DevTools

Install the Chrome extension to inspect component tree and state.

### Console Logging

```tsx
console.log('Product:', product);
```

Logs appear in:
- **Browser console** (client components)
- **Terminal** (server components)

## 📝 Code Style

### Naming Conventions

- **Components:** PascalCase (`ProductCard.tsx`)
- **Functions:** camelCase (`formatPrice`)
- **Constants:** UPPER_SNAKE_CASE (`API_URL`)

### File Organization

```
ComponentName/
  ├── ComponentName.tsx
  ├── ComponentName.test.tsx
  └── ComponentName.module.css (if needed)
```

Or flat structure (current):

```
components/
  ├── Button.tsx
  ├── Card.tsx
  └── ProductCard.tsx
```

## 🧪 Testing (Future)

When ready to add tests:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Example test:

```tsx
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev/)

## 🆘 Common Issues

### "Module not found" error

```bash
npm install
```

### Port 3000 already in use

```bash
npm run dev -- -p 3001  # Use port 3001 instead
```

### TypeScript errors

```bash
npm run build  # Check for type errors
```

## 🎓 Learning Path

1. **Week 1:** Understand component structure, props, state
2. **Week 2:** Master Tailwind CSS utilities, responsive design
3. **Week 3:** Learn routing, layouts, metadata
4. **Week 4:** Data fetching, API routes, forms
5. **Week 5:** State management, performance optimization

---

Happy coding! 🚀

