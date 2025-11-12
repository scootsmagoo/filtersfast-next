import { NextRequest, NextResponse } from 'next/server';

const SEC_PER_DAY = 24 * 60 * 60;

export const CAMPAIGN_COOKIE = 'ff_campaign';
export const CAMPAIGN_FREE_SHIPPING_COOKIE = 'ff_free_shipping';
export const CAMPAIGN_PROMO_COOKIE = 'ff_campaign_promo';
export const CAMPAIGN_CONTEXT_COOKIE = 'ff_campaign_context';

type CampaignTrigger =
  | { type: 'path'; value: string }
  | { type: 'query'; key: string; value: string }
  | { type: 'utm'; key: string; value: string };

export interface CampaignDefinition {
  slug: string;
  label: string;
  description?: string;
  freeShipping?: boolean;
  promoCode?: string;
  contextTag?: string;
  expiresDays?: number;
  redirectPath?: string;
  triggers: CampaignTrigger[];
}

const campaignDefinitions: CampaignDefinition[] = [
  {
    slug: 'filter10now',
    label: 'Filter10now Legacy Landing',
    description:
      'Mirrors Filter10now.asp behaviour – grants campaign free-shipping flag and exposes the 10offdeal2 context tag.',
    freeShipping: true,
    contextTag: '10offdeal2',
    expiresDays: 7,
    redirectPath: '/',
    triggers: [
      { type: 'path', value: '/filter10now' },
      { type: 'query', key: 'campaign', value: 'filter10now' },
      { type: 'query', key: 'contexttag', value: '10offdeal2' }
    ]
  },
  {
    slug: 'charlotte-free-shipping',
    label: 'Charlotte Free Shipping (CLT.asp)',
    description: 'Sets a 3-day free shipping window for CLT landing pages.',
    freeShipping: true,
    contextTag: 'CLT',
    expiresDays: 3,
    redirectPath: '/',
    triggers: [
      { type: 'path', value: '/clt' },
      { type: 'query', key: 'campaign', value: 'clt' }
    ]
  },
  {
    slug: 'wisconsin-free-shipping',
    label: 'Wisconsin Free Shipping (fs=WIS)',
    description: 'Matches fs=WIS campaign parameters to enable free shipping.',
    freeShipping: true,
    expiresDays: 3,
    redirectPath: '/',
    triggers: [{ type: 'query', key: 'fs', value: 'wis' }]
  },
  {
    slug: 'ff10-email-offer',
    label: 'FF10 Email Offer',
    description: 'Auto-applies the FF10 discount code for compatible campaign links.',
    promoCode: 'FF10',
    contextTag: '762519',
    expiresDays: 7,
    redirectPath: '/',
    triggers: [
      { type: 'query', key: 'eml', value: 'ff10' },
      { type: 'utm', key: 'utm_campaign', value: 'ff10' },
      { type: 'query', key: 'campaign', value: 'ff10' }
    ]
  }
];

function normalise(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
}

function triggerMatches(request: NextRequest, trigger: CampaignTrigger): boolean {
  switch (trigger.type) {
    case 'path': {
      const path = normalise(request.nextUrl.pathname);
      return path === normalise(trigger.value);
    }
    case 'query': {
      const candidate = normalise(request.nextUrl.searchParams.get(trigger.key));
      return candidate === normalise(trigger.value);
    }
    case 'utm': {
      const candidate = normalise(request.nextUrl.searchParams.get(trigger.key));
      return candidate === normalise(trigger.value);
    }
    default:
      return false;
  }
}

export function resolveCampaignFromRequest(request: NextRequest): CampaignDefinition | undefined {
  for (const campaign of campaignDefinitions) {
    if (campaign.triggers.some(trigger => triggerMatches(request, trigger))) {
      return campaign;
    }
  }
  return undefined;
}

export function getCampaignDefinition(slug: string): CampaignDefinition | undefined {
  const candidate = normalise(slug);
  if (!candidate) {
    return undefined;
  }
  return campaignDefinitions.find(campaign => normalise(campaign.slug) === candidate);
}

export function applyCampaignToResponse(
  response: NextResponse,
  campaign: CampaignDefinition,
  { refreshExpiry = false }: { refreshExpiry?: boolean } = {}
): void {
  const maxAge = (campaign.expiresDays ?? 7) * SEC_PER_DAY;
  const secure = process.env.NODE_ENV === 'production';
  const commonCookieOptions = {
    path: '/',
    maxAge,
    sameSite: 'lax' as const,
    secure,
    httpOnly: false
  };

  const existingSlug = response.cookies.get(CAMPAIGN_COOKIE)?.value;
  if (!existingSlug || refreshExpiry || normalise(existingSlug) !== normalise(campaign.slug)) {
    response.cookies.set(CAMPAIGN_COOKIE, campaign.slug, commonCookieOptions);
  }

  if (campaign.freeShipping) {
    response.cookies.set(CAMPAIGN_FREE_SHIPPING_COOKIE, '1', commonCookieOptions);
  }

  if (campaign.promoCode) {
    response.cookies.set(CAMPAIGN_PROMO_COOKIE, campaign.promoCode, commonCookieOptions);
  }

  if (campaign.contextTag) {
    response.cookies.set(CAMPAIGN_CONTEXT_COOKIE, campaign.contextTag, commonCookieOptions);
  }
}

export { campaignDefinitions };

