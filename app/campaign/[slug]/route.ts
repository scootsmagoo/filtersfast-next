import { NextRequest, NextResponse } from 'next/server';
import { applyCampaignToResponse, getCampaignDefinition } from '@/lib/campaigns';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const slug = params.slug ?? '';
  const campaign = getCampaignDefinition(slug);

  if (!campaign) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const redirectCandidate = request.nextUrl.searchParams.get('redirect');
  const safeRedirect =
    redirectCandidate && redirectCandidate.startsWith('/')
      ? redirectCandidate
      : campaign.redirectPath ?? '/';

  const destination = new URL(safeRedirect, request.url);
  const response = NextResponse.redirect(destination);

  applyCampaignToResponse(response, campaign, { refreshExpiry: true });

  return response;
}

