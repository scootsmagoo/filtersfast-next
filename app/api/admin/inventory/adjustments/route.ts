// ========================================
// INVENTORY ADJUSTMENTS API
// ========================================
// Purpose: Manual inventory adjustments (corrections, damage, theft, etc.)
// Endpoints: GET (list), POST (create adjustment)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/inventory';
import { checkPermission } from '@/lib/permissions';

// ========================================
// GET /api/admin/inventory/adjustments
// List inventory adjustments with filtering
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
    const idProduct = searchParams.get('idProduct');
    const adjustmentType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Whitelist sort direction (prevent SQL injection)
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';
    const sortOrder = sortOrderParam === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions: string[] = [];
    const params: any[] = [];

    if (idProduct) {
      whereConditions.push('ia.idProduct = ?');
      params.push(parseInt(idProduct));
    }

    if (adjustmentType) {
      whereConditions.push('ia.adjustmentType = ?');
      params.push(adjustmentType);
    }

    if (startDate) {
      whereConditions.push('DATE(ia.createdDate) >= DATE(?)');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(ia.createdDate) <= DATE(?)');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_adjustments ia
      ${whereClause}
    `;

    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get adjustments data
    const dataQuery = `
      SELECT 
        ia.idAdjustment,
        ia.idProduct,
        ia.idOption,
        ia.adjustmentType,
        ia.quantityChange,
        ia.quantityBefore,
        ia.quantityAfter,
        ia.reason,
        ia.notes,
        ia.createdDate,
        ia.costImpact,
        ia.createdBy,
        p.sku,
        p.description as productDescription,
        o.optionDescrip as optionDescription
      FROM inventory_adjustments ia
      INNER JOIN products p ON ia.idProduct = p.idProduct
      LEFT JOIN options o ON ia.idOption = o.idOption
      ${whereClause}
      ORDER BY ia.createdDate ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const adjustments = db.prepare(dataQuery).all(...params);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as totalAdjustments,
        SUM(CASE WHEN quantityChange > 0 THEN quantityChange ELSE 0 END) as totalAdded,
        SUM(CASE WHEN quantityChange < 0 THEN ABS(quantityChange) ELSE 0 END) as totalRemoved,
        SUM(quantityChange) as netChange,
        SUM(COALESCE(costImpact, 0)) as totalCostImpact,
        adjustmentType,
        COUNT(*) as typeCount
      FROM inventory_adjustments ia
      ${whereClause}
      GROUP BY adjustmentType
    `;

    const summary = db.prepare(summaryQuery).all(...params);

    return NextResponse.json({
      success: true,
      data: adjustments,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/admin/inventory/adjustments
// Create a new inventory adjustment
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
      adjustmentType,
      quantityChange,
      reason,
      notes,
      costImpact,
    } = body;

    // Validation
    if (!idProduct || !adjustmentType || quantityChange === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: idProduct, adjustmentType, quantityChange, reason' },
        { status: 400 }
      );
    }

    // Validate numeric inputs
    if (!Number.isInteger(idProduct) || idProduct <= 0) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantityChange) || Math.abs(quantityChange) > 100000) {
      return NextResponse.json(
        { error: 'Invalid quantity change (must be integer, max ±100,000)' },
        { status: 400 }
      );
    }

    if (idOption && (!Number.isInteger(idOption) || idOption <= 0)) {
      return NextResponse.json(
        { error: 'Invalid option ID' },
        { status: 400 }
      );
    }

    // Validate reason length (prevent huge text)
    if (reason.length > 1000) {
      return NextResponse.json(
        { error: 'Reason too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Validate adjustment type
    const validTypes = ['correction', 'damage', 'theft', 'shrinkage', 'returned', 'found', 'other'];
    if (!validTypes.includes(adjustmentType)) {
      return NextResponse.json(
        { error: `Invalid adjustment type. Must be one of: ${validTypes.join(', ')}` },
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

    // Get current stock
    let currentStock: number;

    if (idOption) {
      // Option-level inventory
      const optionStock = db.prepare(`
        SELECT stock 
        FROM productOptionInventory 
        WHERE idProduct = ? AND idOption = ?
      `).get(idProduct, idOption) as { stock: number } | undefined;

      if (!optionStock) {
        return NextResponse.json(
          { error: 'Option inventory not found' },
          { status: 404 }
        );
      }

      currentStock = optionStock.stock;
    } else {
      // Product-level inventory
      const productStock = db.prepare(`
        SELECT stock 
        FROM products 
        WHERE idProduct = ?
      `).get(idProduct) as { stock: number } | undefined;

      if (!productStock) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      currentStock = productStock.stock;
    }

    // Validate newStock would be reasonable
    const newStock = currentStock + quantityChange;
    if (newStock < -1000 || newStock > 1000000) {
      return NextResponse.json(
        { error: 'Invalid stock level - value out of reasonable range' },
        { status: 400 }
      );
    }

    // Prevent negative stock (optional - can be disabled if needed)
    if (newStock < 0) {
      return NextResponse.json(
        { error: `Adjustment would result in negative stock (${newStock}). Current stock: ${currentStock}` },
        { status: 400 }
      );
    }

    // Create adjustment record
    const result = db.prepare(`
      INSERT INTO inventory_adjustments (
        idProduct, idOption, adjustmentType, quantityChange,
        quantityBefore, quantityAfter, reason, notes, costImpact, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      idProduct,
      idOption || null,
      adjustmentType,
      quantityChange,
      currentStock,
      newStock,
      reason,
      notes || null,
      costImpact || null,
      adminId
    );

    const idAdjustment = result.lastInsertRowid;

    // Update stock levels
    if (idOption) {
      db.prepare(`
        UPDATE productOptionInventory 
        SET stock = ?, actualInventory = ?
        WHERE idProduct = ? AND idOption = ?
      `).run(newStock, newStock, idProduct, idOption);
    } else {
      db.prepare(`
        UPDATE products 
        SET stock = ?, actualInventory = ?
        WHERE idProduct = ?
      `).run(newStock, newStock, idProduct);
    }

    // Log the movement
    db.prepare(`
      INSERT INTO inventory_movement_log (
        idProduct, idOption, movementType, quantityChange,
        quantityBefore, quantityAfter, referenceType, referenceId, performedBy, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      idProduct,
      idOption || null,
      'adjustment',
      quantityChange,
      currentStock,
      newStock,
      'adjustment',
      idAdjustment,
      adminId,
      `${adjustmentType}: ${reason}`
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

    return NextResponse.json({
      success: true,
      message: 'Inventory adjustment created successfully',
      data: {
        idAdjustment,
        idProduct,
        idOption,
        adjustmentType,
        quantityChange,
        previousStock: currentStock,
        newStock,
        reason,
      },
    });

  } catch (error) {
    console.error('Error creating adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to create adjustment' },
      { status: 500 }
    );
  }
}

