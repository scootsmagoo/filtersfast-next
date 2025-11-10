import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addCampaignRecipients,
  getCampaignRecipients,
} from '@/lib/db/email-campaigns';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';

const idSchema = z.coerce.number().positive();

const addRecipientsSchema = z.object({
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .min(1)
    .max(5000),
  overwrite: z.boolean().optional(),
});

const listRecipientsSchema = z.object({
  status: z
    .enum(['pending', 'sending', 'sent', 'failed', 'skipped'])
    .optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  offset: z.coerce.number().min(0).optional(),
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

      const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
      const queryResult = listRecipientsSchema.safeParse(searchParams);
      if (!queryResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid query parameters' },
          { status: 400 }
        );
      }

      const { recipients, total } = getCampaignRecipients(idResult.data, {
        status: queryResult.data.status,
        limit: queryResult.data.limit,
        offset: queryResult.data.offset,
      });

      return NextResponse.json({
        success: true,
        recipients,
        total,
      });
    } catch (error) {
      console.error('[email-campaigns] Failed to list recipients:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load recipients' },
        { status: 500 }
      );
    }
  }
);

export const POST = requirePermission('EmailCampaigns', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, context: { params: { id: string }; admin: any }) => {
    try {
      const idResult = idSchema.safeParse(context.params.id);
      if (!idResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid campaign id' },
          { status: 400 }
        );
      }

      const payload = await request.json();
      const validation = addRecipientsSchema.safeParse(payload);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const result = addCampaignRecipients(idResult.data, validation.data);

      return NextResponse.json({
        success: true,
        added: result.added,
        skipped: result.skipped,
      });
    } catch (error) {
      console.error('[email-campaigns] Failed to add recipients:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add recipients',
        },
        { status: 500 }
      );
    }
  }
);




