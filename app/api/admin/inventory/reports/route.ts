// ========================================
// INVENTORY REPORTS API
// ========================================
// Purpose: Generate inventory reports and analytics
// Endpoints: GET with different report types
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/inventory';
import { checkPermission } from '@/lib/permissions';

// ========================================
// GET /api/admin/inventory/reports
// Generate inventory reports based on type
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
    const reportType = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const idProduct = searchParams.get('idProduct');

    switch (reportType) {
      case 'summary':
        return await generateSummaryReport();
      case 'movement':
        return await generateMovementReport(startDate, endDate, idProduct);
      case 'valuation':
        return await generateValuationReport();
      case 'turnover':
        return await generateTurnoverReport(startDate, endDate);
      case 'low-stock':
        return await generateLowStockReport();
      case 'shipments':
        return await generateShipmentsReport(startDate, endDate);
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// ========================================
// REPORT GENERATORS
// ========================================

// Summary Report: Overall inventory status
async function generateSummaryReport() {
  const summary = db.prepare(`
    SELECT 
      COUNT(DISTINCT p.idProduct) as totalProducts,
      SUM(p.stock) as totalUnits,
      SUM(p.stock * p.price) as totalValue,
      SUM(CASE WHEN p.stock <= 0 THEN 1 ELSE 0 END) as outOfStock,
      SUM(CASE WHEN p.stock <= 5 THEN 1 ELSE 0 END) as criticalStock,
      SUM(CASE WHEN p.stock <= 10 THEN 1 ELSE 0 END) as lowStock,
      SUM(CASE WHEN p.ignoreStock = 1 THEN 1 ELSE 0 END) as ignoreStockCount
    FROM products p
    WHERE p.active = 1
  `).get();

  const topProducts = db.prepare(`
    SELECT 
      p.idProduct,
      p.sku,
      p.description,
      p.stock,
      p.price,
      p.stock * p.price as totalValue
    FROM products p
    WHERE p.active = 1
    ORDER BY totalValue DESC
    LIMIT 20
  `).all();

  const recentAdjustments = db.prepare(`
    SELECT 
      ia.idAdjustment,
      ia.adjustmentType,
      ia.quantityChange,
      ia.createdDate,
      p.sku,
      p.description
    FROM inventory_adjustments ia
    INNER JOIN products p ON ia.idProduct = p.idProduct
    ORDER BY ia.createdDate DESC
    LIMIT 10
  `).all();

  return NextResponse.json({
    success: true,
    reportType: 'summary',
    data: {
      summary,
      topProducts,
      recentAdjustments,
    },
  });
}

// Movement Report: Stock movements over time
async function generateMovementReport(
  startDate: string | null,
  endDate: string | null,
  idProduct: string | null
) {
  let whereConditions: string[] = [];
  const params: any[] = [];

  if (startDate) {
    whereConditions.push('DATE(performedDate) >= DATE(?)');
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push('DATE(performedDate) <= DATE(?)');
    params.push(endDate);
  }

  if (idProduct) {
    whereConditions.push('idProduct = ?');
    params.push(parseInt(idProduct));
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  const movements = db.prepare(`
    SELECT 
      DATE(performedDate) as date,
      movementType,
      COUNT(*) as transactionCount,
      SUM(CASE WHEN quantityChange > 0 THEN quantityChange ELSE 0 END) as totalAdded,
      SUM(CASE WHEN quantityChange < 0 THEN ABS(quantityChange) ELSE 0 END) as totalRemoved,
      SUM(quantityChange) as netChange
    FROM inventory_movement_log
    ${whereClause}
    GROUP BY DATE(performedDate), movementType
    ORDER BY DATE(performedDate) DESC
  `).all(...params);

  const summary = db.prepare(`
    SELECT 
      movementType,
      COUNT(*) as count,
      SUM(quantityChange) as totalChange
    FROM inventory_movement_log
    ${whereClause}
    GROUP BY movementType
  `).all(...params);

  return NextResponse.json({
    success: true,
    reportType: 'movement',
    data: {
      movements,
      summary,
    },
  });
}

// Valuation Report: Current inventory value
async function generateValuationReport() {
  const valuation = db.prepare(`
    SELECT 
      p.idProduct,
      p.sku,
      p.description,
      p.stock,
      p.price,
      p.listPrice,
      p.stock * p.price as totalCost,
      p.stock * p.listPrice as totalRetail,
      (p.stock * p.listPrice) - (p.stock * p.price) as potentialProfit
    FROM products p
    WHERE p.active = 1 AND p.stock > 0
    ORDER BY totalCost DESC
  `).all();

  const totals = db.prepare(`
    SELECT 
      SUM(p.stock) as totalUnits,
      SUM(p.stock * p.price) as totalCost,
      SUM(p.stock * p.listPrice) as totalRetail,
      SUM((p.stock * p.listPrice) - (p.stock * p.price)) as potentialProfit
    FROM products p
    WHERE p.active = 1
  `).get();

  return NextResponse.json({
    success: true,
    reportType: 'valuation',
    data: {
      valuation,
      totals,
    },
  });
}

// Turnover Report: Inventory velocity
async function generateTurnoverReport(
  startDate: string | null,
  endDate: string | null
) {
  let dateCondition = '';
  const params: any[] = [];

  if (startDate && endDate) {
    dateCondition = 'AND DATE(performedDate) BETWEEN DATE(?) AND DATE(?)';
    params.push(startDate, endDate);
  }

  const turnover = db.prepare(`
    SELECT 
      p.idProduct,
      p.sku,
      p.description,
      p.stock as currentStock,
      COUNT(CASE WHEN iml.movementType = 'sale' THEN 1 END) as salesCount,
      SUM(CASE WHEN iml.movementType = 'sale' THEN ABS(iml.quantityChange) ELSE 0 END) as unitsSold,
      SUM(CASE WHEN iml.movementType = 'shipment_received' THEN iml.quantityChange ELSE 0 END) as unitsReceived,
      AVG(p.stock) as avgStock,
      CASE 
        WHEN AVG(p.stock) > 0 
        THEN SUM(CASE WHEN iml.movementType = 'sale' THEN ABS(iml.quantityChange) ELSE 0 END) / AVG(p.stock)
        ELSE 0 
      END as turnoverRate
    FROM products p
    LEFT JOIN inventory_movement_log iml ON p.idProduct = iml.idProduct
    WHERE p.active = 1 ${dateCondition}
    GROUP BY p.idProduct
    HAVING unitsSold > 0
    ORDER BY turnoverRate DESC
  `).all(...params);

  return NextResponse.json({
    success: true,
    reportType: 'turnover',
    data: turnover,
  });
}

// Low Stock Report: Products needing attention
async function generateLowStockReport() {
  const lowStock = db.prepare(`
    SELECT 
      p.idProduct,
      p.sku,
      p.description,
      p.stock,
      ia.lowStockThreshold,
      ia.criticalStockThreshold,
      ia.reorderPoint,
      ia.reorderQuantity,
      ia.preferredSupplier,
      ia.leadTimeDays,
      ia.alertStatus,
      CASE 
        WHEN p.stock <= 0 THEN 'Urgent - Out of Stock'
        WHEN p.stock <= ia.criticalStockThreshold THEN 'Critical'
        WHEN p.stock <= ia.lowStockThreshold THEN 'Low'
        ELSE 'OK'
      END as priority
    FROM products p
    INNER JOIN inventory_alerts ia ON p.idProduct = ia.idProduct AND ia.idOption IS NULL
    WHERE p.active = 1 
      AND ia.alertEnabled = 1
      AND p.stock <= ia.lowStockThreshold
    ORDER BY p.stock ASC, ia.criticalStockThreshold DESC
  `).all();

  const summary = db.prepare(`
    SELECT 
      COUNT(CASE WHEN p.stock <= 0 THEN 1 END) as outOfStock,
      COUNT(CASE WHEN p.stock <= ia.criticalStockThreshold AND p.stock > 0 THEN 1 END) as critical,
      COUNT(CASE WHEN p.stock <= ia.lowStockThreshold AND p.stock > ia.criticalStockThreshold THEN 1 END) as low,
      SUM(ia.reorderQuantity) as totalReorderQty,
      SUM(ia.reorderQuantity * p.price) as estimatedReorderCost
    FROM products p
    INNER JOIN inventory_alerts ia ON p.idProduct = ia.idProduct AND ia.idOption IS NULL
    WHERE p.active = 1 AND ia.alertEnabled = 1 AND p.stock <= ia.lowStockThreshold
  `).get();

  return NextResponse.json({
    success: true,
    reportType: 'low-stock',
    data: {
      lowStock,
      summary,
    },
  });
}

// Shipments Report: Inbound shipment analytics
async function generateShipmentsReport(
  startDate: string | null,
  endDate: string | null
) {
  let dateCondition = '';
  const params: any[] = [];

  if (startDate && endDate) {
    dateCondition = 'WHERE DATE(s.createdDate) BETWEEN DATE(?) AND DATE(?)';
    params.push(startDate, endDate);
  }

  const shipments = db.prepare(`
    SELECT 
      s.idShipment,
      s.shipmentNumber,
      s.supplierName,
      s.status,
      s.expectedDate,
      s.receivedDate,
      s.totalItems,
      s.totalCost,
      COUNT(si.idShipmentItem) as itemCount,
      SUM(si.expectedQuantity) as expectedQty,
      SUM(si.receivedQuantity) as receivedQty,
      SUM(si.damagedQuantity) as damagedQty,
      JULIANDAY(s.receivedDate) - JULIANDAY(s.createdDate) as daysToReceive
    FROM inventory_shipments s
    LEFT JOIN inventory_shipment_items si ON s.idShipment = si.idShipment
    ${dateCondition}
    GROUP BY s.idShipment
    ORDER BY s.createdDate DESC
  `).all(...params);

  const summary = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(totalItems) as items,
      SUM(totalCost) as totalCost,
      AVG(JULIANDAY(receivedDate) - JULIANDAY(createdDate)) as avgDaysToReceive
    FROM inventory_shipments s
    ${dateCondition}
    GROUP BY status
  `).all(...params);

  return NextResponse.json({
    success: true,
    reportType: 'shipments',
    data: {
      shipments,
      summary,
    },
  });
}

