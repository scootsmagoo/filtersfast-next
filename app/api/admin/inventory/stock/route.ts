// ========================================
// INVENTORY STOCK MANAGEMENT API
// ========================================
// Purpose: Manage stock levels for products and options
// Endpoints: GET, PATCH (update stock levels)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/inventory';
import { checkPermission } from '@/lib/permissions';

// ========================================
// GET /api/admin/inventory/stock
// List stock levels with filtering
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
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '50'))); // Max 500
    const search = searchParams.get('search') || '';
    const stockFilter = searchParams.get('stockFilter') || 'all'; // all, low, critical, out
    
    // Whitelist allowed sort columns (prevent SQL injection)
    const sortByParam = searchParams.get('sortBy') || 'description';
    const allowedSortColumns = ['description', 'sku', 'stock', 'price'];
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'description';
    
    // Whitelist sort direction (prevent SQL injection)
    const sortOrderParam = searchParams.get('sortOrder') || 'asc';
    const sortOrder = sortOrderParam === 'desc' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['p.active = 1'];
    const params: any[] = [];

    if (search) {
      whereConditions.push('(p.description LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Stock filter
    switch (stockFilter) {
      case 'low':
        whereConditions.push('p.stock <= COALESCE(ia.lowStockThreshold, 10)');
        whereConditions.push('p.stock > COALESCE(ia.criticalStockThreshold, 5)');
        break;
      case 'critical':
        whereConditions.push('p.stock <= COALESCE(ia.criticalStockThreshold, 5)');
        whereConditions.push('p.stock > 0');
        break;
      case 'out':
        whereConditions.push('p.stock <= 0');
        break;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.idProduct) as total
      FROM products p
      LEFT JOIN inventory_alerts ia ON p.idProduct = ia.idProduct AND ia.idOption IS NULL
      ${whereClause}
    `;

    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get stock data
    const dataQuery = `
      SELECT 
        p.idProduct,
        p.sku,
        p.description,
        COALESCE(p.stock, 0) as stock,
        p.price,
        p.listPrice,
        ia.lowStockThreshold,
        ia.criticalStockThreshold,
        ia.reorderPoint,
        ia.reorderQuantity,
        ia.alertStatus,
        ia.alertEnabled,
        ia.preferredSupplier,
        ia.supplierSKU,
        ia.leadTimeDays,
        ia.lastAlertDate,
        CASE 
          WHEN COALESCE(p.stock, 0) <= 0 THEN 'out_of_stock'
          WHEN COALESCE(p.stock, 0) <= COALESCE(ia.criticalStockThreshold, 5) THEN 'critical'
          WHEN COALESCE(p.stock, 0) <= COALESCE(ia.lowStockThreshold, 10) THEN 'low'
          ELSE 'ok'
        END as calculatedStatus
      FROM products p
      LEFT JOIN inventory_alerts ia ON p.idProduct = ia.idProduct AND ia.idOption IS NULL
      ${whereClause}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const stockData = db.prepare(dataQuery).all(...params);

    return NextResponse.json({
      success: true,
      data: stockData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock levels' },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH /api/admin/inventory/stock
// Update stock levels (single or bulk)
// ========================================
export async function PATCH(request: NextRequest) {
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
    const { updates } = body; // Array of { idProduct, idOption?, newStock, reason }

    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Prevent bulk abuse - limit to 100 updates at once
    if (updates.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 updates per request' },
        { status: 400 }
      );
    }

    const adminId = permissionCheck.admin?.id;
    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID not found' },
        { status: 403 }
      );
    }
    const results: any[] = [];

    // Process each update
    for (const update of updates) {
      const { idProduct, idOption, newStock, reason } = update;

      // Validate required fields
      if (!idProduct || newStock === undefined) {
        results.push({
          idProduct,
          success: false,
          error: 'Missing required fields',
        });
        continue;
      }

      // Validate numeric inputs
      if (!Number.isInteger(idProduct) || idProduct <= 0) {
        results.push({
          idProduct,
          success: false,
          error: 'Invalid product ID',
        });
        continue;
      }

      if (!Number.isInteger(newStock) || newStock < 0 || newStock > 1000000) {
        results.push({
          idProduct,
          success: false,
          error: 'Invalid stock value (must be 0-1,000,000)',
        });
        continue;
      }

      if (idOption && (!Number.isInteger(idOption) || idOption <= 0)) {
        results.push({
          idProduct,
          success: false,
          error: 'Invalid option ID',
        });
        continue;
      }

      try {
        // Get current stock
        let currentStock: number;
        let actualInventory: number | null;

        if (idOption) {
          // Option-level inventory
          const optionStock = db.prepare(`
            SELECT stock, actualInventory 
            FROM productOptionInventory 
            WHERE idProduct = ? AND idOption = ?
          `).get(idProduct, idOption) as { stock: number; actualInventory: number | null } | undefined;

          if (!optionStock) {
            results.push({
              idProduct,
              idOption,
              success: false,
              error: 'Option inventory not found',
            });
            continue;
          }

          currentStock = optionStock.stock;
          actualInventory = optionStock.actualInventory;

          // Update option stock
          db.prepare(`
            UPDATE productOptionInventory 
            SET stock = ?, actualInventory = ?
            WHERE idProduct = ? AND idOption = ?
          `).run(newStock, newStock, idProduct, idOption);

        } else {
          // Product-level inventory
          const productStock = db.prepare(`
            SELECT stock, actualInventory 
            FROM products 
            WHERE idProduct = ?
          `).get(idProduct) as { stock: number; actualInventory: number | null } | undefined;

          if (!productStock) {
            results.push({
              idProduct,
              success: false,
              error: 'Product not found',
            });
            continue;
          }

          currentStock = productStock.stock;
          actualInventory = productStock.actualInventory;

          // Update product stock
          db.prepare(`
            UPDATE products 
            SET stock = ?, actualInventory = ?
            WHERE idProduct = ?
          `).run(newStock, newStock, idProduct);
        }

        const quantityChange = newStock - currentStock;

        // Log the adjustment
        db.prepare(`
          INSERT INTO inventory_adjustments (
            idProduct, idOption, adjustmentType, quantityChange,
            quantityBefore, quantityAfter, reason, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          idProduct,
          idOption || null,
          'manual_adjustment',
          quantityChange,
          currentStock,
          newStock,
          reason || 'Manual stock update',
          adminId
        );

        // Log the movement
        db.prepare(`
          INSERT INTO inventory_movement_log (
            idProduct, idOption, movementType, quantityChange,
            quantityBefore, quantityAfter, referenceType, performedBy, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          idProduct,
          idOption || null,
          'adjustment',
          quantityChange,
          currentStock,
          newStock,
          'manual_adjustment',
          adminId,
          reason || 'Manual stock update'
        );

        // Update alert status if exists
        db.prepare(`
          UPDATE inventory_alerts
          SET currentStockLevel = ?,
              alertStatus = CASE 
                WHEN ? <= 0 THEN 'out_of_stock'
                WHEN ? <= criticalStockThreshold THEN 'critical'
                WHEN ? <= lowStockThreshold THEN 'low'
                ELSE 'ok'
              END,
              updatedDate = CURRENT_TIMESTAMP
          WHERE idProduct = ? AND (idOption IS NULL OR idOption = ?)
        `).run(newStock, newStock, newStock, newStock, idProduct, idOption || null);

        results.push({
          idProduct,
          idOption,
          success: true,
          previousStock: currentStock,
          newStock,
          change: quantityChange,
        });

      } catch (error) {
        console.error(`Error updating stock for product ${idProduct}:`, error);
        results.push({
          idProduct,
          idOption,
          success: false,
          error: 'Update failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stock update completed',
      results,
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

