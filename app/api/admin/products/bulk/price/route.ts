import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { checkRateLimit } from '@/lib/rate-limit-admin';
import { enqueueBackgroundJob } from '@/lib/background-jobs';
import { auditLog } from '@/lib/audit-log';
import {
  bulkUpdateProductPrices
} from '@/lib/db/products';
import {
  createProductBulkJob,
  startProductBulkJob,
  completeProductBulkJob,
  failProductBulkJob,
  updateProductBulkJobProgress,
  addProductBulkJobItem
} from '@/lib/db/product-bulk-jobs';

const priceUpdateSchema = z.object({
  updates: z
    .array(
      z
        .object({
          productId: z.string().min(1),
          price: z.number().nonnegative().finite().optional(),
          compareAtPrice: z.number().nonnegative().finite().nullable().optional(),
          costPrice: z.number().nonnegative().finite().nullable().optional()
        })
        .refine(
          (value) =>
            value.price !== undefined ||
            value.compareAtPrice !== undefined ||
            value.costPrice !== undefined,
          {
            message: 'At least one price field must be provided per update'
          }
        )
    )
    .min(1)
    .max(500),
  note: z.string().max(500).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const rateLimitResult = checkRateLimit(session.user.id, {
      maxRequests: 10,
      windowMs: 60_000,
      keyPrefix: 'product-bulk-price'
    });

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    const body = await request.json();
    const payload = priceUpdateSchema.parse(body);

    const job = createProductBulkJob({
      type: 'price-update',
      totalItems: payload.updates.length,
      parameters: {
        note: payload.note || null
      },
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email
    });

    enqueueBackgroundJob({
      id: job.id,
      description: 'Bulk product price update',
      run: async () => {
        startProductBulkJob(job.id);

        try {
          const result = bulkUpdateProductPrices(
            payload.updates,
            session.user.id,
            session.user.name || session.user.email,
            payload.note || 'Bulk price update'
          );

          updateProductBulkJobProgress(job.id, {
            processedItems: result.updated + result.skipped,
            failedItems: result.errors.length + result.notFound.length
          });

          result.notFound.forEach((productId) => {
            addProductBulkJobItem({
              jobId: job.id,
              reference: productId,
              status: 'failed',
              error: 'Product not found'
            });
          });

          result.errors.forEach(({ productId, error }) => {
            addProductBulkJobItem({
              jobId: job.id,
              reference: productId,
              status: 'failed',
              error
            });
          });

          const summary = {
            totalRequested: payload.updates.length,
            updated: result.updated,
            skipped: result.skipped,
            notFound: result.notFound.length,
            failures: result.errors.length + result.notFound.length
          };

          completeProductBulkJob(job.id, summary);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Bulk price update failed';
          failProductBulkJob(job.id, message, {
            totalRequested: payload.updates.length
          });
        }
      }
    });

    await auditLog({
      action: 'product.bulk-price',
      userId: session.user.id,
      resource: 'product_bulk_job',
      resourceId: job.id,
      status: 'success',
      details: {
        updateCount: payload.updates.length
      }
    });

    return NextResponse.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Bulk price update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to schedule bulk price update'
      },
      { status: 500 }
    );
  }
}



