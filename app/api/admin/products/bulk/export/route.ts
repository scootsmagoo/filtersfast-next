import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { checkRateLimit } from '@/lib/rate-limit-admin';
import { enqueueBackgroundJob } from '@/lib/background-jobs';
import { auditLog } from '@/lib/audit-log';
import {
  generateProductExportCsv
} from '@/lib/db/products';
import {
  createProductBulkJob,
  startProductBulkJob,
  completeProductBulkJob,
  failProductBulkJob,
  updateProductBulkJobProgress,
  saveProductBulkJobResult
} from '@/lib/db/product-bulk-jobs';
import type { ProductFilters } from '@/lib/types/product';

const exportSchema = z
  .object({
    filters: z
      .object({
        status: z.enum(['active', 'draft', 'archived', 'out-of-stock']).optional(),
        type: z
          .enum([
            'air-filter',
            'water-filter',
            'refrigerator-filter',
            'humidifier-filter',
            'pool-filter',
            'custom',
            'accessory',
            'other'
          ])
          .optional(),
        brand: z.string().max(100).optional(),
        search: z.string().max(200).optional(),
        minPrice: z.number().min(0).max(999999.99).optional(),
        maxPrice: z.number().min(0).max(999999.99).optional()
      })
      .partial()
      .optional(),
    columns: z.array(z.string().min(1)).max(100).optional()
  })
  .optional();

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const rateLimitResult = checkRateLimit(session.user.id, {
      maxRequests: 5,
      windowMs: 60_000,
      keyPrefix: 'product-export-csv'
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

    const jsonBody = await request.json().catch(() => ({}));
    const payload = exportSchema.parse(jsonBody) ?? {};

    const filters: ProductFilters = payload.filters || {};
    const columns = payload.columns || undefined;

    const job = createProductBulkJob({
      type: 'export-csv',
      totalItems: 0,
      parameters: {
        filters,
        columns
      },
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email
    });

    enqueueBackgroundJob({
      id: job.id,
      description: 'Product CSV export',
      run: async () => {
        startProductBulkJob(job.id);

        try {
          const result = generateProductExportCsv({
            filters,
            columns
          });

          saveProductBulkJobResult(job.id, {
            content: result.csv,
            mimeType: 'text/csv',
            fileName: result.fileName
          });

          updateProductBulkJobProgress(job.id, {
            processedItems: result.rowCount,
            failedItems: 0
          });

          completeProductBulkJob(job.id, {
            rowCount: result.rowCount,
            fileName: result.fileName
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'CSV export failed';
          failProductBulkJob(job.id, message, {
            filters,
            columns
          });
        }
      }
    });

    await auditLog({
      action: 'product.bulk-export',
      userId: session.user.id,
      resource: 'product_bulk_job',
      resourceId: job.id,
      status: 'success',
      details: {
        filters,
        columns
      }
    });

    return NextResponse.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Product export scheduling failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule product export' },
      { status: 500 }
    );
  }
}



