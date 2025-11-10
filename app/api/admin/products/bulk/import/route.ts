import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { checkRateLimit } from '@/lib/rate-limit-admin';
import { enqueueBackgroundJob } from '@/lib/background-jobs';
import { auditLog } from '@/lib/audit-log';
import { parseCsv } from '@/lib/utils/csv';
import {
  processProductImportRows
} from '@/lib/db/products';
import {
  createProductBulkJob,
  startProductBulkJob,
  completeProductBulkJob,
  failProductBulkJob,
  updateProductBulkJobProgress,
  addProductBulkJobItem
} from '@/lib/db/product-bulk-jobs';
import type { ProductImportRow, ProductImportOptions } from '@/lib/types/product';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMPORT_ROWS = 5000;

const booleanTrueValues = new Set(['true', '1', 'yes', 'y']);

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return undefined;
  return booleanTrueValues.has(normalized);
}

function parseNullableNumber(value: string | undefined): number | null | undefined {
  if (value === undefined) return undefined;
  if (value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key.trim().toLowerCase()] = (value ?? '').trim();
  });
  return normalized;
}

function mapCsvRows(rows: Record<string, string>[]): ProductImportRow[] {
  return rows.map((row) => {
    const normalized = normalizeRow(row);
    return {
      sku: normalized['sku'] || normalized['product_id'] || '',
      status: normalized['status'],
      price: parseNullableNumber(normalized['price']),
      compareAtPrice: parseNullableNumber(normalized['compare_at_price']),
      costPrice: parseNullableNumber(normalized['cost_price']),
      inventoryQuantity: parseNullableNumber(normalized['inventory_quantity'])
        ?? parseNullableNumber(normalized['inventory']) ?? undefined,
      lowStockThreshold: parseNullableNumber(normalized['low_stock_threshold']) ?? undefined,
      allowBackorder: parseBoolean(normalized['allow_backorder']),
      trackInventory: parseBoolean(normalized['track_inventory'])
    } as ProductImportRow;
  });
}

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
      keyPrefix: 'product-import-csv'
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

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'CSV file is required' },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file is empty' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File exceeds maximum size of ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB`
        },
        { status: 413 }
      );
    }

    const text = await file.text();

    let parsed;
    try {
      parsed = parseCsv(text, { maxRows: MAX_IMPORT_ROWS });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid CSV format';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data rows found in CSV' },
        { status: 400 }
      );
    }

    const options: ProductImportOptions = {
      allowCreate: formData.get('allowCreate') === 'true',
      updatePricing: formData.get('updatePricing') !== 'false',
      updateInventory: formData.get('updateInventory') !== 'false',
      updateStatus: formData.get('updateStatus') !== 'false'
    };

    const importRows = mapCsvRows(parsed.rows);

    const job = createProductBulkJob({
      type: 'import-csv',
      totalItems: importRows.length,
      parameters: {
        options
      },
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email
    });

    enqueueBackgroundJob({
      id: job.id,
      description: 'Product CSV import',
      run: async () => {
        startProductBulkJob(job.id);

        try {
          const result = processProductImportRows(
            importRows,
            options,
            session.user.id,
            session.user.name || session.user.email
          );

          updateProductBulkJobProgress(job.id, {
            processedItems: result.processedRows,
            failedItems: result.failures.length
          });

          result.failures.slice(0, 200).forEach((failure) => {
            addProductBulkJobItem({
              jobId: job.id,
              reference: failure.sku,
              status: 'failed',
              payload: { rowNumber: failure.rowNumber },
              error: failure.error
            });
          });

          const summary = {
            totalRows: result.totalRows,
            processedRows: result.processedRows,
            updated: result.updated,
            statusUpdates: result.statusUpdates,
            priceUpdates: result.priceUpdates,
            inventoryUpdates: result.inventoryUpdates,
            failures: result.failures.length
          };

          completeProductBulkJob(job.id, summary);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'CSV import failed';
          failProductBulkJob(job.id, message, {
            totalRows: importRows.length
          });
        }
      }
    });

    await auditLog({
      action: 'product.bulk-import',
      userId: session.user.id,
      resource: 'product_bulk_job',
      resourceId: job.id,
      status: 'success',
      details: {
        totalRows: importRows.length,
        options
      }
    });

    return NextResponse.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Product CSV import scheduling failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule product import' },
      { status: 500 }
    );
  }
}

