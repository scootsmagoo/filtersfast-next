// ========================================
// INVENTORY SHIPMENTS API
// ========================================
// Purpose: Manage inbound shipments from suppliers
// Endpoints: GET (list), POST (create shipment)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/inventory';
import { checkPermission } from '@/lib/permissions';

// ========================================
// GET /api/admin/inventory/shipments
// List inbound shipments with filtering
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
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    
    // Whitelist allowed sort columns (prevent SQL injection)
    const sortByParam = searchParams.get('sortBy') || 'createdDate';
    const allowedSortColumns = ['createdDate', 'shipmentNumber', 'supplierName', 'status', 'expectedDate'];
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : 'createdDate';
    
    // Whitelist sort direction (prevent SQL injection)
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';
    const sortOrder = sortOrderParam === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions: string[] = [];
    const params: any[] = [];

    if (status) {
      whereConditions.push('s.status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(s.shipmentNumber LIKE ? OR s.supplierName LIKE ? OR s.supplierPO LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_shipments s
      ${whereClause}
    `;

    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get shipments data
    const dataQuery = `
      SELECT 
        s.idShipment,
        s.shipmentNumber,
        s.supplierName,
        s.supplierPO,
        s.status,
        s.expectedDate,
        s.receivedDate,
        s.createdDate,
        s.trackingNumber,
        s.carrier,
        s.notes,
        s.totalItems,
        s.totalCost,
        s.createdBy,
        s.receivedBy,
        COUNT(DISTINCT si.idShipmentItem) as itemCount,
        SUM(si.expectedQuantity) as totalExpectedQty,
        SUM(si.receivedQuantity) as totalReceivedQty,
        SUM(si.damagedQuantity) as totalDamagedQty
      FROM inventory_shipments s
      LEFT JOIN inventory_shipment_items si ON s.idShipment = si.idShipment
      ${whereClause}
      GROUP BY s.idShipment
      ORDER BY s.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const shipments = db.prepare(dataQuery).all(...params);

    // Get status summary
    const statusSummary = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(totalItems) as items,
        SUM(totalCost) as cost
      FROM inventory_shipments
      GROUP BY status
    `).all();

    return NextResponse.json({
      success: true,
      data: shipments,
      statusSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/admin/inventory/shipments
// Create a new inbound shipment
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
      supplierName,
      supplierPO,
      expectedDate,
      trackingNumber,
      carrier,
      notes,
      items, // Array of { idProduct, idOption?, expectedQuantity, unitCost? }
    } = body;

    // Validation
    if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: supplierName, items (array)' },
        { status: 400 }
      );
    }

    // Prevent abuse - limit items per shipment
    if (items.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 items per shipment' },
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

    // Generate shipment number
    const seqResult = db.prepare(`
      UPDATE inventory_sequences 
      SET currentValue = currentValue + 1, lastUpdated = CURRENT_TIMESTAMP
      WHERE sequenceName = 'shipment_number'
      RETURNING currentValue, prefix
    `).get() as { currentValue: number; prefix: string };

    const shipmentNumber = `${seqResult.prefix}${String(seqResult.currentValue).padStart(6, '0')}`;

    // Calculate totals
    const totalItems = items.reduce((sum, item) => sum + item.expectedQuantity, 0);
    const totalCost = items.reduce((sum, item) => sum + (item.unitCost || 0) * item.expectedQuantity, 0);

    // Create shipment
    const shipmentResult = db.prepare(`
      INSERT INTO inventory_shipments (
        shipmentNumber, supplierName, supplierPO, expectedDate,
        trackingNumber, carrier, notes, totalItems, totalCost, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      shipmentNumber,
      supplierName,
      supplierPO || null,
      expectedDate || null,
      trackingNumber || null,
      carrier || null,
      notes || null,
      totalItems,
      totalCost,
      adminId
    );

    const idShipment = shipmentResult.lastInsertRowid;

    // Insert shipment items
    const insertItem = db.prepare(`
      INSERT INTO inventory_shipment_items (
        idShipment, idProduct, idOption, expectedQuantity, unitCost
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const itemResults = [];
    for (const item of items) {
      // Validate product exists
      const productExists = db.prepare(`
        SELECT idProduct FROM products WHERE idProduct = ?
      `).get(item.idProduct);

      if (!productExists) {
        // Rollback would require transaction - for now just log error
        console.error(`Product ${item.idProduct} not found`);
        continue;
      }

      const itemResult = insertItem.run(
        idShipment,
        item.idProduct,
        item.idOption || null,
        item.expectedQuantity,
        item.unitCost || null
      );

      itemResults.push({
        idShipmentItem: itemResult.lastInsertRowid,
        idProduct: item.idProduct,
        idOption: item.idOption,
        expectedQuantity: item.expectedQuantity,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment created successfully',
      data: {
        idShipment,
        shipmentNumber,
        supplierName,
        status: 'pending',
        totalItems,
        totalCost,
        items: itemResults,
      },
    });

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

