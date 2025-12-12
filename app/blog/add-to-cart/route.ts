import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getProductBySKU } from '@/lib/db/products';
import {
  getProductOptionGroups,
  getProductOptionsWithInventory,
} from '@/lib/db/product-options';
import type { ProductOptionWithInventory } from '@/lib/types/product';
import { RateLimiter } from '@/lib/security';
import { logger } from '@/lib/logger';

interface CartSeedItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  basePrice: number;
  quantity: number;
  image: string;
  productType?: string;
  maxCartQty?: number | null;
  retExclude?: 0 | 1 | 2;
  blockedReason?: string | null;
  options?: Record<string, string>;
  metadata?: Record<string, string>;
}

interface CartSeedPayload {
  version: number;
  generatedAt: number;
  attribution?: Record<string, string>;
  items: CartSeedItem[];
}

const CART_SEED_COOKIE = 'ff_cart_seed';
const ATTRIBUTION_KEYS = ['source', 'medium', 'campaign', 'content', 'term', 'influencer', 'ref'] as const;
const BLOG_CART_RATE_LIMITER = new RateLimiter(25, 60 * 1000);

function normalizeProductId(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^prod-\w+$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^\d+$/.test(trimmed)) {
    return `prod-${trimmed}`;
  }
  return null;
}

function normalizeSku(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
}

function normalizeOptionId(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^opt-\w+$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^\d+$/.test(trimmed)) {
    return `opt-${trimmed}`;
  }
  return null;
}

function sanitizeAttribution(value: string | null, fallback?: string): string | undefined {
  if (!value && !fallback) return undefined;
  const val = (value ?? fallback ?? '').trim();
  if (!val) return undefined;
  return val.replace(/[^a-z0-9\s\-\._]/gi, '').slice(0, 60);
}

function resolveRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('..')) return fallback;
  return trimmed;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function clampQuantity(raw: string | null, maxCartQty: number | null): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  let qty = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  const limit = maxCartQty && maxCartQty > 0 ? Math.min(maxCartQty, 999) : 999;
  if (qty > limit) qty = limit;
  return qty;
}

function adjustPrice(basePrice: number, option?: { priceToAdd: number; percToAdd: number }): number {
  let adjustment = 0;
  if (option) {
    if (Number.isFinite(option.percToAdd) && option.percToAdd !== 0) {
      adjustment += (basePrice * option.percToAdd) / 100;
    }
    if (Number.isFinite(option.priceToAdd) && option.priceToAdd !== 0) {
      adjustment += option.priceToAdd;
    }
  }
  const total = basePrice + adjustment;
  const rounded = Math.round((Number.isFinite(total) ? total : basePrice) * 100) / 100;
  return rounded > 0 ? rounded : basePrice;
}

function buildProductRedirect(request: NextRequest, productId: string, reason: string) {
  const destination = new URL(`/products/${encodeURIComponent(productId)}`, request.nextUrl.origin);
  destination.searchParams.set('blog', reason);
  return NextResponse.redirect(destination);
}

function buildCartRedirect(request: NextRequest, status: string, redirectPath?: string, retryAfterSeconds?: number) {
  const destination = new URL(redirectPath ?? '/cart', request.nextUrl.origin);
  destination.searchParams.set('seeded', status);
  const response = NextResponse.redirect(destination);
  if (retryAfterSeconds !== undefined) {
    response.headers.set('Retry-After', String(retryAfterSeconds));
  }
  return response;
}

function isOptionAvailable(entry: ProductOptionWithInventory | undefined): boolean {
  if (!entry) return true;
  if (entry.blocked) return false;
  if (entry.unavailable) return false;
  return entry.available;
}

export async function GET(request: NextRequest) {
  const clientIdentifier =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'anonymous';

  if (!BLOG_CART_RATE_LIMITER.isAllowed(clientIdentifier)) {
    logger.warn('Blog cart seed rate limited', { clientIdentifier });
    const retryAfter = BLOG_CART_RATE_LIMITER.getRemainingTime(clientIdentifier);
    return buildCartRedirect(request, 'rate-limited', '/cart', retryAfter);
  }

  const url = new URL(request.url);
  const params = url.searchParams;

  const normalizedProductId = normalizeProductId(params.get('productId') ?? params.get('ProductID'));
  const normalizedSku = normalizeSku(params.get('sku') ?? params.get('SKU'));
  const normalizedOptionId = normalizeOptionId(params.get('optionId') ?? params.get('OptionID'));
  const redirectPath = resolveRedirectPath(params.get('redirect'), '/cart');

  let product = normalizedProductId ? getProductById(normalizedProductId) : null;
  if (!product && normalizedSku) {
    product = getProductBySKU(normalizedSku);
  }

  if (!product) {
    logger.warn('Blog cart seed - product not found', {
      productId: normalizedProductId,
      sku: normalizedSku,
      query: Object.fromEntries(params.entries()),
    });
    return buildCartRedirect(request, 'invalid-product', redirectPath);
  }

  if (product.status === 'archived') {
    return buildProductRedirect(request, product.id, 'disc');
  }

  if (product.status !== 'active') {
    return buildProductRedirect(request, product.id, 'inactive');
  }

  if (product.blockedReason) {
    return buildProductRedirect(request, product.id, 'unavailable');
  }

  const isOutOfStock =
    product.status === 'out-of-stock' ||
    (product.trackInventory && !product.allowBackorder && product.inventoryQuantity <= 0);

  if (isOutOfStock) {
    return buildProductRedirect(request, product.id, 'oos');
  }

  const optionGroups = getProductOptionGroups(product.id);
  const requiredGroups = optionGroups.filter(group => group.optionReq === 'Y');
  const optionsWithInventory = optionGroups.length > 0 ? getProductOptionsWithInventory(product.id) : {};

  let selectedOptionGroupId: string | undefined;
  let optionPriceReference: { priceToAdd: number; percToAdd: number } | undefined;

  if (normalizedOptionId) {
    for (const group of optionGroups) {
      const match = group.options.find(opt => opt.idOption === normalizedOptionId);
      if (match) {
        selectedOptionGroupId = group.idOptionGroup;
        optionPriceReference = { priceToAdd: match.priceToAdd, percToAdd: match.percToAdd };
        const inventoryDetails = optionsWithInventory[group.idOptionGroup]?.find(opt => opt.idOption === normalizedOptionId);
        if (!isOptionAvailable(inventoryDetails)) {
          return buildProductRedirect(request, product.id, inventoryDetails?.blocked ? 'option-discontinued' : 'option-unavailable');
        }
        break;
      }
    }

    if (!selectedOptionGroupId) {
      logger.warn('Blog cart seed - option not linked to product', {
        productId: product.id,
        optionId: normalizedOptionId,
      });
      return buildProductRedirect(request, product.id, 'option-unavailable');
    }
  }

  if (requiredGroups.length > 0 && !selectedOptionGroupId) {
    return buildProductRedirect(request, product.id, 'option-required');
  }

  const quantity = clampQuantity(params.get('quantity') ?? params.get('qty'), product.maxCartQty ?? null);
  const finalPrice = adjustPrice(product.price, optionPriceReference);

  const attributionEntries = ATTRIBUTION_KEYS.reduce<Record<string, string>>((acc, key) => {
    const sanitized = sanitizeAttribution(params.get(key), undefined);
    if (sanitized) {
      acc[key] = sanitized;
    }
    return acc;
  }, {});

  const attributionDefaults: Record<string, string> = {
    source: 'Blog',
    medium: 'Web',
    campaign: 'blog-to-cart',
  };

  const attribution = {
    ...attributionDefaults,
    ...attributionEntries,
  };

  const metadata: Record<string, string> = {
    referralSource: 'blog.filtersfast.com',
    ingestion: 'blog-to-cart',
    ...(attribution.source ? { source: attribution.source } : {}),
    ...(attribution.medium ? { medium: attribution.medium } : {}),
    ...(attribution.campaign ? { campaign: attribution.campaign } : {}),
  };

  if (attribution.influencer) {
    metadata.influencer = attribution.influencer;
  }
  if (attribution.ref) {
    metadata.ref = attribution.ref;
  }

  const cartItem: CartSeedItem = {
    id: product.id,
    productId: product.id,
    name: product.name.slice(0, 200),
    brand: product.brand.slice(0, 120),
    sku: product.sku.slice(0, 120),
    price: finalPrice,
    basePrice: product.price,
    quantity,
    image: product.primaryImage || product.images?.[0]?.url || '',
    productType: product.type,
    maxCartQty: product.maxCartQty ?? null,
    retExclude: product.retExclude ?? 0,
    blockedReason: product.blockedReason ?? null,
    metadata,
  };

  if (selectedOptionGroupId && normalizedOptionId) {
    cartItem.options = { [selectedOptionGroupId]: normalizedOptionId };
  }

  const payload: CartSeedPayload = {
    version: 1,
    generatedAt: Date.now(),
    attribution,
    items: [cartItem],
  };

  const serialized = JSON.stringify(payload);

  if (serialized.length > 2000) {
    logger.error('Blog cart seed payload too large', {
      productId: product.id,
      serializedLength: serialized.length,
    });
    return buildCartRedirect(request, 'payload-too-large', redirectPath);
  }

  const encodedPayload = toBase64Url(serialized);

  const destination = new URL(redirectPath, request.nextUrl.origin);
  destination.searchParams.set('seeded', 'blog');
  destination.searchParams.set('utm_source', attribution.source);
  destination.searchParams.set('utm_medium', attribution.medium);
  destination.searchParams.set('utm_campaign', attribution.campaign);
  if (attribution.content) destination.searchParams.set('utm_content', attribution.content);
  if (attribution.term) destination.searchParams.set('utm_term', attribution.term);

  const response = NextResponse.redirect(destination);
  response.cookies.set({
    name: CART_SEED_COOKIE,
    value: encodedPayload,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60, // 1 minute
  });

  logger.info('Blog cart seed prepared', {
    productId: product.id,
    optionId: normalizedOptionId,
    quantity,
    source: attribution.source,
    medium: attribution.medium,
    campaign: attribution.campaign,
  });

  return response;
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}


