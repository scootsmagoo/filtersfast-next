// ========================================
// INVENTORY SHIPMENT DETAIL API
// ========================================
// Purpose: Get, update, and receive individual shipments
// Endpoints: GET, PATCH, POST (receive)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/inventory';
import { checkPermission } from '@/lib/permissions';

// ========================================
// GET /api/admin/inventory/shipments/[id]
// Get shipment details with items
// ========================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Inventory', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const idShipment = parseInt(params.id);

    // Get shipment details
    const shipment = db.prepare(`
      SELECT s.*
      FROM inventory_shipments s
      WHERE s.idShipment = ?
    `).get(idShipment);

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Get shipment items
    const items = db.prepare(`
      SELECT 
        si.*,
        p.sku,
        p.description as productDescription,
        o.optionDescrip as optionDescription
      FROM inventory_shipment_items si
      INNER JOIN products p ON si.idProduct = p.idProduct
      LEFT JOIN options o ON si.idOption = o.idOption
      WHERE si.idShipment = ?
      ORDER BY si.idShipmentItem
    `).all(idShipment);

    return NextResponse.json({
      success: true,
      data: {
        ...shipment,
        items,
      },
    });

  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH /api/admin/inventory/shipments/[id]
// Update shipment details (status, tracking, etc.)
// ========================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Inventory', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const idShipment = parseInt(params.id);
    const body = await request.json();

    const {
      status,
      expectedDate,
      trackingNumber,
      carrier,
      notes,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (expectedDate !== undefined) {
      updates.push('expectedDate = ?');
      values.push(expectedDate);
    }
    if (trackingNumber !== undefined) {
      updates.push('trackingNumber = ?');
      values.push(trackingNumber);
    }
    if (carrier !== undefined) {
      updates.push('carrier = ?');
      values.push(carrier);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(idShipment);

    db.prepare(`
      UPDATE inventory_shipments
      SET ${updates.join(', ')}
      WHERE idShipment = ?
    `).run(...values);

    // Get updated shipment
    const shipment = db.prepare(`
      SELECT * FROM inventory_shipments WHERE idShipment = ?
    `).get(idShipment);

    return NextResponse.json({
      success: true,
      message: 'Shipment updated successfully',
      data: shipment,
    });

  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/admin/inventory/shipments/[id]/receive
// Receive shipment items and update stock
// ========================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Inventory', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const idShipment = parseInt(params.id);
    
    // Validate shipment ID
    if (isNaN(idShipment) || idShipment <= 0) {
      return NextResponse.json(
        { error: 'Invalid shipment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items, notes } = body; // Array of { idShipmentItem, receivedQuantity, damagedQuantity?, notes? }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Prevent abuse - limit receiving items per request
    if (items.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 items per request' },
        { status: 400 }
      );
    }

    // Validate notes length
    if (notes && notes.length > 5000) {
      return NextResponse.json(
        { error: 'Notes too long (max 5000 characters)' },
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

    // Verify shipment exists and is not already received
    const shipment = db.prepare(`
      SELECT * FROM inventory_shipments WHERE idShipment = ?
    `).get(idShipment) as any;

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    if (shipment.status === 'received') {
      return NextResponse.json(
        { error: 'Shipment already received' },
        { status: 400 }
      );
    }

    const results = [];

    // Process each item
    for (const item of items) {
      const { idShipmentItem, receivedQuantity, damagedQuantity = 0, notes: itemNotes } = item;

      // Validate item inputs
      if (!Number.isInteger(idShipmentItem) || idShipmentItem <= 0) {
        results.push({
          idShipmentItem,
          success: false,
          error: 'Invalid shipment item ID',
        });
        continue;
      }

      if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0 || receivedQuantity > 100000) {
        results.push({
          idShipmentItem,
          success: false,
          error: 'Invalid received quantity (must be 0-100,000)',
        });
        continue;
      }

      if (!Number.isInteger(damagedQuantity) || damagedQuantity < 0 || damagedQuantity > receivedQuantity) {
        results.push({
          idShipmentItem,
          success: false,
          error: 'Invalid damaged quantity',
        });
        continue;
      }

      if (itemNotes && itemNotes.length > 1000) {
        results.push({
          idShipmentItem,
          success: false,
          error: 'Item notes too long (max 1000 characters)',
        });
        continue;
      }

      // Get shipment item details
      const shipmentItem = db.prepare(`
        SELECT * FROM inventory_shipment_items WHERE idShipmentItem = ?
      `).get(idShipmentItem) as any;

      if (!shipmentItem || shipmentItem.idShipment !== idShipment) {
        results.push({
          idShipmentItem,
          success: false,
          error: 'Shipment item not found or does not belong to this shipment',
        });
        continue;
      }

      // Update shipment item
      db.prepare(`
        UPDATE inventory_shipment_items
        SET receivedQuantity = ?,
            damagedQuantity = ?,
            notes = ?,
            receivedDate = CURRENT_TIMESTAMP
        WHERE idShipmentItem = ?
      `).run(receivedQuantity, damagedQuantity, itemNotes || null, idShipmentItem);

      // Update stock levels (only for non-damaged items)
      const stockIncrease = receivedQuantity - damagedQuantity;

      if (stockIncrease > 0) {
        if (shipmentItem.idOption) {
          // Option-level inventory
          db.prepare(`
            UPDATE productOptionInventory 
            SET stock = stock + ?,
                actualInventory = actualInventory + ?
            WHERE idProduct = ? AND idOption = ?
          `).run(stockIncrease, stockIncrease, shipmentItem.idProduct, shipmentItem.idOption);
        } else {
          // Product-level inventory
          db.prepare(`
            UPDATE products 
            SET stock = stock + ?,
                actualInventory = actualInventory + ?
            WHERE idProduct = ?
          `).run(stockIncrease, stockIncrease, shipmentItem.idProduct);
        }

        // Log the movement
        db.prepare(`
          INSERT INTO inventory_movement_log (
            idProduct, idOption, movementType, quantityChange,
            quantityBefore, quantityAfter, referenceType, referenceId, performedBy, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          shipmentItem.idProduct,
          shipmentItem.idOption || null,
          'shipment_received',
          stockIncrease,
          0, // We don't track before/after in this context
          stockIncrease,
          'shipment',
          idShipment,
          adminId,
          `Received from shipment: ${shipment.shipmentNumber}`
        );

        // Update alert status if exists
        db.prepare(`
          UPDATE inventory_alerts
          SET currentStockLevel = (
                SELECT stock FROM products WHERE idProduct = ?
              ),
              alertStatus = CASE 
                WHEN (SELECT stock FROM products WHERE idProduct = ?) <= 0 THEN 'out_of_stock'
                WHEN (SELECT stock FROM products WHERE idProduct = ?) <= criticalStockThreshold THEN 'critical'
                WHEN (SELECT stock FROM products WHERE idProduct = ?) <= lowStockThreshold THEN 'low'
                ELSE 'ok'
              END,
              updatedDate = CURRENT_TIMESTAMP
          WHERE idProduct = ? AND (idOption IS NULL OR idOption = ?)
        `).run(
          shipmentItem.idProduct,
          shipmentItem.idProduct,
          shipmentItem.idProduct,
          shipmentItem.idProduct,
          shipmentItem.idProduct,
          shipmentItem.idOption || null
        );
      }

      results.push({
        idShipmentItem,
        idProduct: shipmentItem.idProduct,
        idOption: shipmentItem.idOption,
        success: true,
        receivedQuantity,
        damagedQuantity,
        stockIncrease,
      });
    }

    // Update shipment status to received
    db.prepare(`
      UPDATE inventory_shipments
      SET status = 'received',
          receivedDate = CURRENT_TIMESTAMP,
          receivedBy = ?,
          notes = COALESCE(notes || CHAR(10) || ?, ?)
      WHERE idShipment = ?
    `).run(adminId, notes || '', notes || '', idShipment);

    return NextResponse.json({
      success: true,
      message: 'Shipment received successfully',
      data: {
        idShipment,
        shipmentNumber: shipment.shipmentNumber,
        results,
      },
    });

  } catch (error) {
    console.error('Error receiving shipment:', error);
    return NextResponse.json(
      { error: 'Failed to receive shipment' },
      { status: 500 }
    );
  }
}

