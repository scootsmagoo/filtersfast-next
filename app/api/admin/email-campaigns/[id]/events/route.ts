import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCampaignEvents } from '@/lib/db/email-campaigns';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';

const idSchema = z.coerce.number().positive();

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).optional(),
});

export const GET = requirePermission('EmailCampaigns', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest, context: { params: { id: string } }) => {
    try {
      const idResult = idSchema.safeParse(context.params.id);
      if (!idResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid campaign id' },
          { status: 400 }
        );
      }

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());
      const queryResult = querySchema.safeParse(query);
      if (!queryResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid query parameters' },
          { status: 400 }
        );
      }

      const events = getCampaignEvents(idResult.data, queryResult.data.limit);
      return NextResponse.json({ success: true, events });
    } catch (error) {
      console.error('[email-campaigns] Failed to load campaign events:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load campaign events' },
        { status: 500 }
      );
    }
  }
);




