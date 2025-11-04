// ========================================
// INVENTORY ALERTS API
// ========================================
// Purpose: Manage low stock alerts and thresholds
// Endpoints: GET (list alerts), POST (create/update alert), DELETE
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/inventory';
import { checkPermission } from '@/lib/permissions';

// ========================================
// GET /api/admin/inventory/alerts
// List inventory alerts with filtering
// ========================================
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Inventory', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const alertStatus = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    
    // Whitelist allowed sort columns (prevent SQL injection)
    const sortByParam = searchParams.get('sortBy') || 'alertStatus';
    const allowedSortColumns = ['alertStatus', 'currentStockLevel', 'lastAlertDate'];
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'alertStatus';
    
    // Whitelist sort direction (prevent SQL injection)
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';
    const sortOrder = sortOrderParam === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions: string[] = ['p.active = 1', 'ia.alertEnabled = 1'];
    const params: any[] = [];

    if (alertStatus) {
      whereConditions.push('ia.alertStatus = ?');
      params.push(alertStatus);
    }

    if (search) {
      whereConditions.push('(p.description LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_alerts ia
      INNER JOIN products p ON ia.idProduct = p.idProduct
      ${whereClause}
    `;

    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get alerts data
    const dataQuery = `
      SELECT 
        ia.idAlert,
        ia.idProduct,
        ia.idOption,
        ia.lowStockThreshold,
        ia.criticalStockThreshold,
        ia.reorderPoint,
        ia.reorderQuantity,
        ia.alertEnabled,
        ia.currentStockLevel,
        ia.lastAlertDate,
        ia.alertStatus,
        ia.preferredSupplier,
        ia.supplierSKU,
        ia.leadTimeDays,
        ia.autoReorderEnabled,
        p.sku,
        p.description as productDescription,
        p.stock as currentStock,
        p.actualInventory,
        o.optionDescrip as optionDescription,
        CASE 
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= ia.criticalStockThreshold THEN 'critical'
          WHEN p.stock <= ia.lowStockThreshold THEN 'low'
          ELSE 'ok'
        END as calculatedStatus
      FROM inventory_alerts ia
      INNER JOIN products p ON ia.idProduct = p.idProduct
      LEFT JOIN options o ON ia.idOption = o.idOption
      ${whereClause}
      ORDER BY 
        CASE ia.${sortBy}
          WHEN 'out_of_stock' THEN 1
          WHEN 'critical' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END ${sortOrder},
        p.description ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const alerts = db.prepare(dataQuery).all(...params);

    // Get summary by status
    const summaryQuery = `
      SELECT 
        ia.alertStatus,
        COUNT(*) as count,
        SUM(ia.reorderQuantity) as totalReorderQty,
        SUM(ia.reorderQuantity * p.price) as estimatedReorderCost
      FROM inventory_alerts ia
      INNER JOIN products p ON ia.idProduct = p.idProduct
      WHERE ia.alertEnabled = 1 AND p.active = 1
      GROUP BY ia.alertStatus
    `;

    const summary = db.prepare(summaryQuery).all();

    return NextResponse.json({
      success: true,
      data: alerts,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/admin/inventory/alerts
// Create or update inventory alert configuration
// ========================================
export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Inventory', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      idProduct,
      idOption,
      lowStockThreshold,
      criticalStockThreshold,
      reorderPoint,
      reorderQuantity,
      alertEnabled,
      preferredSupplier,
      supplierSKU,
      leadTimeDays,
      autoReorderEnabled,
    } = body;

    // Validation
    if (!idProduct) {
      return NextResponse.json(
        { error: 'idProduct is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = db.prepare(`
      SELECT idProduct, stock FROM products WHERE idProduct = ?
    `).get(idProduct) as { idProduct: number; stock: number } | undefined;

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if alert already exists
    const existingAlert = db.prepare(`
      SELECT idAlert FROM inventory_alerts 
      WHERE idProduct = ? AND (idOption IS NULL OR idOption = ?)
    `).get(idProduct, idOption || null);

    let idAlert;

    if (existingAlert) {
      // Update existing alert
      const updates: string[] = [];
      const values: any[] = [];

      if (lowStockThreshold !== undefined) {
        updates.push('lowStockThreshold = ?');
        values.push(lowStockThreshold);
      }
      if (criticalStockThreshold !== undefined) {
        updates.push('criticalStockThreshold = ?');
        values.push(criticalStockThreshold);
      }
      if (reorderPoint !== undefined) {
        updates.push('reorderPoint = ?');
        values.push(reorderPoint);
      }
      if (reorderQuantity !== undefined) {
        updates.push('reorderQuantity = ?');
        values.push(reorderQuantity);
      }
      if (alertEnabled !== undefined) {
        updates.push('alertEnabled = ?');
        values.push(alertEnabled ? 1 : 0);
      }
      if (preferredSupplier !== undefined) {
        updates.push('preferredSupplier = ?');
        values.push(preferredSupplier);
      }
      if (supplierSKU !== undefined) {
        updates.push('supplierSKU = ?');
        values.push(supplierSKU);
      }
      if (leadTimeDays !== undefined) {
        updates.push('leadTimeDays = ?');
        values.push(leadTimeDays);
      }
      if (autoReorderEnabled !== undefined) {
        updates.push('autoReorderEnabled = ?');
        values.push(autoReorderEnabled ? 1 : 0);
      }

      updates.push('currentStockLevel = ?');
      values.push(product.stock);

      updates.push('updatedDate = CURRENT_TIMESTAMP');

      values.push((existingAlert as any).idAlert);

      db.prepare(`
        UPDATE inventory_alerts
        SET ${updates.join(', ')}
        WHERE idAlert = ?
      `).run(...values);

      idAlert = (existingAlert as any).idAlert;

    } else {
      // Create new alert
      const result = db.prepare(`
        INSERT INTO inventory_alerts (
          idProduct, idOption, lowStockThreshold, criticalStockThreshold,
          reorderPoint, reorderQuantity, alertEnabled, currentStockLevel,
          preferredSupplier, supplierSKU, leadTimeDays, autoReorderEnabled,
          alertStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          CASE 
            WHEN ? <= 0 THEN 'out_of_stock'
            WHEN ? <= ? THEN 'critical'
            WHEN ? <= ? THEN 'low'
            ELSE 'ok'
          END
        )
      `).run(
        idProduct,
        idOption || null,
        lowStockThreshold || 10,
        criticalStockThreshold || 5,
        reorderPoint || 20,
        reorderQuantity || 50,
        alertEnabled !== false ? 1 : 0,
        product.stock,
        preferredSupplier || null,
        supplierSKU || null,
        leadTimeDays || null,
        autoReorderEnabled ? 1 : 0,
        product.stock, // For CASE statement
        product.stock,
        criticalStockThreshold || 5,
        product.stock,
        lowStockThreshold || 10
      );

      idAlert = result.lastInsertRowid;
    }

    // Get the complete alert
    const alert = db.prepare(`
      SELECT 
        ia.*,
        p.sku,
        p.description as productDescription,
        o.optionDescrip as optionDescription
      FROM inventory_alerts ia
      INNER JOIN products p ON ia.idProduct = p.idProduct
      LEFT JOIN options o ON ia.idOption = o.idOption
      WHERE ia.idAlert = ?
    `).get(idAlert);

    return NextResponse.json({
      success: true,
      message: existingAlert ? 'Alert updated successfully' : 'Alert created successfully',
      data: alert,
    });

  } catch (error) {
    console.error('Error creating/updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create/update alert' },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE /api/admin/inventory/alerts
// Delete inventory alert
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Inventory', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idAlert = searchParams.get('idAlert');

    if (!idAlert) {
      return NextResponse.json(
        { error: 'idAlert parameter is required' },
        { status: 400 }
      );
    }

    db.prepare(`
      DELETE FROM inventory_alerts WHERE idAlert = ?
    `).run(parseInt(idAlert));

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}

