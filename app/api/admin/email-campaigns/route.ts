/**
 * Admin Email Campaign API
 * GET: list campaigns with summary metrics
 * POST: create new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getEmailCampaigns,
  createEmailCampaign,
} from '@/lib/db/email-campaigns';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';
import type { CreateEmailCampaignInput } from '@/lib/types/email-campaign';

const createCampaignSchema = z.object({
  name: z.string().min(3).max(200),
  subject: z.string().min(1).max(200),
  fromName: z.string().min(1).max(120),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().optional().or(z.literal('')),
  templateId: z.string().min(1).max(255).optional().or(z.literal('')),
  contentHtml: z.string().min(10).optional(),
  contentText: z.string().min(5).optional(),
  targetAudience: z.string().max(120).optional(),
  segmentRules: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
  testMode: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export const GET = requirePermission('EmailCampaigns', PERMISSION_LEVEL.READ_ONLY)(
  async () => {
    try {
      const campaigns = getEmailCampaigns();

      const stats = campaigns.reduce(
        (acc, campaign) => {
          acc.total += 1;
          acc.byStatus[campaign.status] = (acc.byStatus[campaign.status] || 0) + 1;
          acc.totalRecipients += campaign.total_recipients;
          acc.totalSent += campaign.sent_count;
          acc.totalOpens += campaign.open_count;
          acc.totalClicks += campaign.click_count;
          return acc;
        },
        {
          total: 0,
          totalRecipients: 0,
          totalSent: 0,
          totalOpens: 0,
          totalClicks: 0,
          byStatus: {} as Record<string, number>,
        }
      );

      return NextResponse.json({
        success: true,
        campaigns,
        stats,
      });
    } catch (error) {
      console.error('[email-campaigns] Failed to list campaigns:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load campaigns' },
        { status: 500 }
      );
    }
  }
);

export const POST = requirePermission('EmailCampaigns', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, { admin }: { user: any; admin: any }) => {
    try {
      const json = await request.json();
      const validation = createCampaignSchema.safeParse(json);

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

      const data = validation.data;

      if (!data.templateId && !data.contentHtml && !data.contentText) {
        return NextResponse.json(
          {
            success: false,
            error: 'Provide either a template ID or custom HTML/text content.',
          },
          { status: 400 }
        );
      }

      const payload: CreateEmailCampaignInput = {
        name: data.name,
        subject: data.subject,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        replyToEmail: data.replyToEmail || null,
        templateId: data.templateId || null,
        contentHtml: data.templateId ? null : data.contentHtml ?? null,
        contentText: data.templateId ? null : data.contentText ?? null,
        targetAudience: data.targetAudience,
        segmentRules: data.segmentRules,
        scheduledAt: data.scheduledAt,
        testMode: data.testMode,
        metadata: data.metadata,
      };

      const campaign = createEmailCampaign(payload, admin.id);

      return NextResponse.json(
        {
          success: true,
          campaign,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('[email-campaigns] Failed to create campaign:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create campaign' },
        { status: 500 }
      );
    }
  }
);




