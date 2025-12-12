import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getEmailCampaignById,
  getCampaignRecipients,
  updateCampaignStatus,
} from '@/lib/db/email-campaigns';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';
import { enqueueCampaignDispatch } from '@/lib/email/email-campaign-dispatcher';

const idSchema = z.coerce.number().positive();

const requestSchema = z.object({
  action: z.enum(['schedule', 'send-now', 'pause', 'resume', 'cancel']),
  scheduledAt: z.string().datetime().optional(),
});

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
      const validation = requestSchema.safeParse(payload);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request', details: validation.error.flatten() },
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

      const { action, scheduledAt } = validation.data;

      switch (action) {
        case 'schedule': {
          if (!scheduledAt) {
            return NextResponse.json(
              { success: false, error: 'scheduledAt is required for schedule action' },
              { status: 400 }
            );
          }

          const { total } = getCampaignRecipients(campaign.id, { limit: 1 });
          if (total === 0) {
            return NextResponse.json(
              { success: false, error: 'Cannot schedule a campaign with no recipients' },
              { status: 400 }
            );
          }

          const updated = updateCampaignStatus(
            campaign.id,
            'scheduled',
            { scheduledAt },
            context.admin.id
          );

          enqueueCampaignDispatch(campaign.id);

          return NextResponse.json({
            success: true,
            campaign: updated,
            status: 'scheduled',
          });
        }
        case 'send-now': {
          const { total } = getCampaignRecipients(campaign.id, { limit: 1 });
          if (total === 0) {
            return NextResponse.json(
              { success: false, error: 'Cannot send a campaign with no recipients' },
              { status: 400 }
            );
          }

          const updated = updateCampaignStatus(campaign.id, 'sending', {}, context.admin.id);
          enqueueCampaignDispatch(campaign.id);
          return NextResponse.json({ success: true, campaign: updated, status: 'sending' });
        }
        case 'pause': {
          if (campaign.status !== 'sending' && campaign.status !== 'scheduled') {
            return NextResponse.json(
              { success: false, error: 'Can only pause scheduled or sending campaigns' },
              { status: 400 }
            );
          }

          const updated = updateCampaignStatus(campaign.id, 'paused', {}, context.admin.id);
          return NextResponse.json({ success: true, campaign: updated, status: 'paused' });
        }
        case 'resume': {
          if (campaign.status !== 'paused') {
            return NextResponse.json(
              { success: false, error: 'Can only resume paused campaigns' },
              { status: 400 }
            );
          }
          const updated = updateCampaignStatus(campaign.id, 'sending', {}, context.admin.id);
          enqueueCampaignDispatch(campaign.id);
          return NextResponse.json({ success: true, campaign: updated, status: 'sending' });
        }
        case 'cancel': {
          if (campaign.status === 'sent' || campaign.status === 'cancelled') {
            return NextResponse.json(
              { success: false, error: 'Campaign already completed' },
              { status: 400 }
            );
          }
          const updated = updateCampaignStatus(campaign.id, 'cancelled', {}, context.admin.id);
          return NextResponse.json({ success: true, campaign: updated, status: 'cancelled' });
        }
      }
    } catch (error) {
      console.error('[email-campaigns] Failed to update send status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update campaign send status' },
        { status: 500 }
      );
    }
  }
);




