import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getEmailCampaignById,
  updateEmailCampaign,
  deleteEmailCampaign,
  getCampaignSummary,
} from '@/lib/db/email-campaigns';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';

const idSchema = z.coerce.number().positive();

const updateSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  subject: z.string().min(1).max(200).optional(),
  fromName: z.string().min(1).max(120).optional(),
  fromEmail: z.string().email().optional(),
  replyToEmail: z.string().email().optional().or(z.literal('')),
  templateId: z.string().max(255).optional().or(z.literal('')),
  contentHtml: z.string().min(10).optional().or(z.literal('')),
  contentText: z.string().min(5).optional().or(z.literal('')),
  targetAudience: z.string().max(120).optional().or(z.literal('')),
  segmentRules: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
  testMode: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  status: z
    .enum(['draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled'])
    .optional(),
});

export const GET = requirePermission('EmailCampaigns', PERMISSION_LEVEL.READ_ONLY)(
  async (_request: NextRequest, context: { params: { id: string } }) => {
    try {
      const idResult = idSchema.safeParse(context.params.id);
      if (!idResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid campaign id' },
          { status: 400 }
        );
      }

      const campaign = getEmailCampaignById(idResult.data);
      if (!campaign) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }

      const summary = getCampaignSummary(idResult.data);

      return NextResponse.json({
        success: true,
        campaign,
        summary,
      });
    } catch (error) {
      console.error('[email-campaigns] Failed to load campaign:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load campaign' },
        { status: 500 }
      );
    }
  }
);

export const PATCH = requirePermission('EmailCampaigns', PERMISSION_LEVEL.FULL_CONTROL)(
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
      const validation = updateSchema.safeParse(payload);
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

      const updateInput = validation.data;
      if (updateInput.replyToEmail === '') updateInput.replyToEmail = undefined;
      if (updateInput.templateId === '') updateInput.templateId = undefined;
      if (updateInput.contentHtml === '') updateInput.contentHtml = undefined;
      if (updateInput.contentText === '') updateInput.contentText = undefined;
      if (updateInput.targetAudience === '') updateInput.targetAudience = undefined;
      if (updateInput.scheduledAt === '') updateInput.scheduledAt = undefined;

      const updated = updateEmailCampaign(idResult.data, updateInput, context.admin.id);

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }

      const summary = getCampaignSummary(idResult.data);

      return NextResponse.json({
        success: true,
        campaign: updated,
        summary,
      });
    } catch (error) {
      console.error('[email-campaigns] Failed to update campaign:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update campaign' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = requirePermission('EmailCampaigns', PERMISSION_LEVEL.FULL_CONTROL)(
  async (_request: NextRequest, context: { params: { id: string } }) => {
    try {
      const idResult = idSchema.safeParse(context.params.id);
      if (!idResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid campaign id' },
          { status: 400 }
        );
      }

      const removed = deleteEmailCampaign(idResult.data);
      if (!removed) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[email-campaigns] Failed to delete campaign:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete campaign' },
        { status: 500 }
      );
    }
  }
);




