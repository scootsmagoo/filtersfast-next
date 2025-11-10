import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { checkRateLimit } from '@/lib/rate-limit-admin';
import { enqueueBackgroundJob } from '@/lib/background-jobs';
import { auditLog } from '@/lib/audit-log';
import {
  bulkUpdateProductStatus
} from '@/lib/db/products';
import {
  createProductBulkJob,
  startProductBulkJob,
  completeProductBulkJob,
  failProductBulkJob,
  updateProductBulkJobProgress,
  addProductBulkJobItem
} from '@/lib/db/product-bulk-jobs';

const bulkStatusSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(['active', 'draft', 'archived', 'out-of-stock']),
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
      keyPrefix: 'product-bulk-status'
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
    const payload = bulkStatusSchema.parse(body);

    const job = createProductBulkJob({
      type: 'status-update',
      totalItems: payload.productIds.length,
      parameters: {
        status: payload.status,
        note: payload.note || null
      },
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email
    });

    enqueueBackgroundJob({
      id: job.id,
      description: 'Bulk product status update',
      run: async () => {
        startProductBulkJob(job.id);

        try {
          const result = bulkUpdateProductStatus(
            payload.productIds.map((productId) => ({
              productId,
              newStatus: payload.status
            })),
            session.user.id,
            session.user.name || session.user.email,
            payload.note || 'Bulk status update'
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
            status: payload.status,
            totalRequested: payload.productIds.length,
            updated: result.updated,
            skipped: result.skipped,
            notFound: result.notFound.length,
            failures: result.errors.length + result.notFound.length
          };

          completeProductBulkJob(job.id, summary);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Bulk status update failed';
          failProductBulkJob(job.id, message, {
            status: payload.status,
            totalRequested: payload.productIds.length
          });
        }
      }
    });

    await auditLog({
      action: 'product.bulk-status',
      userId: session.user.id,
      resource: 'product_bulk_job',
      resourceId: job.id,
      status: 'success',
      details: {
        status: payload.status,
        productCount: payload.productIds.length
      }
    });

    return NextResponse.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Bulk status update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to schedule bulk status update'
      },
      { status: 500 }
    );
  }
}

