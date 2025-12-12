export function getOptionGroupStats(idOptionGroup: string): OptionGroupStats {
  const db = getDb();
  try {
    return getOptionGroupStatsInternal(db, idOptionGroup);
  } finally {
    db.close();
  }
}

/**
 * Product Options/Variants Database Operations
 * Helper functions for managing product options, option groups, and inventory
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type {
  OptionGroup,
  OptionGroupStats,
  OptionGroupWithStats,
  Option,
  ProductOptionGroup,
  ProductOptionInventory,
  ProductOptionImage,
  ProductOptionExclusion,
  ProductOptionGroupWithOptions,
  ProductOptionWithInventory,
  OptionGroupFormData,
  OptionFormData,
  ProductOptionGroupAssignment,
} from '../types/product';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

function mapOptionGroupRow(row: any): OptionGroup {
  return {
    idOptionGroup: row.idOptionGroup,
    optionGroupDesc: row.optionGroupDesc,
    optionReq: row.optionReq,
    optionType: row.optionType,
    sizingLink: row.sizingLink,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    optionCount: row.optionCount ?? undefined,
    productCount: row.productCount ?? undefined,
  };
}

function getOptionGroupStatsInternal(db: Database, idOptionGroup: string): OptionGroupStats {
  const counts = db.prepare(
    `
      SELECT
        (SELECT COUNT(*) FROM option_group_xref WHERE idOptionGroup = ?) AS optionCount,
        (SELECT COUNT(*) FROM product_option_groups WHERE idOptionGroup = ?) AS productCount
    `
  ).get(idOptionGroup, idOptionGroup) as { optionCount: number; productCount: number };

  return {
    optionCount: counts?.optionCount ?? 0,
    productCount: counts?.productCount ?? 0,
  };
}

// ============================================================================
// OPTION GROUPS CRUD
// ============================================================================

/**
 * Get all option groups with option/product counts
 */
export function getAllOptionGroups(): OptionGroupWithStats[] {
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT
        og.*,
        (
          SELECT COUNT(*) 
          FROM option_group_xref x 
          WHERE x.idOptionGroup = og.idOptionGroup
        ) AS optionCount,
        (
          SELECT COUNT(*)
          FROM product_option_groups pog
          WHERE pog.idOptionGroup = og.idOptionGroup
        ) AS productCount
      FROM option_groups og
      ORDER BY og.sortOrder, og.optionGroupDesc
    `).all();
    return rows.map(mapOptionGroupRow);
  } finally {
    db.close();
  }
}

/**
 * Get option group by ID
 */
export function getOptionGroupById(idOptionGroup: string, withStats = false): OptionGroup | null {
  // Validate ID format (defense in depth)
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    return null;
  }
  
  const db = getDb();
  
  try {
    const row = db.prepare('SELECT * FROM option_groups WHERE idOptionGroup = ?').get(idOptionGroup);
    if (!row) return null;
    
    const optionGroup = mapOptionGroupRow(row);
    if (withStats) {
      const stats = getOptionGroupStatsInternal(db, idOptionGroup);
      return { ...optionGroup, ...stats };
    }

    return optionGroup;
  } finally {
    db.close();
  }
}

/**
 * Create option group
 */
export function createOptionGroup(data: OptionGroupFormData): OptionGroup {
  // Validate inputs (defense in depth - though API should have validated already)
  if (!data.optionGroupDesc || typeof data.optionGroupDesc !== 'string' || data.optionGroupDesc.trim().length === 0) {
    throw new Error('Option group description is required');
  }
  if (data.optionGroupDesc.length > 255) {
    throw new Error('Option group description must be 255 characters or less');
  }
  
  const db = getDb();
  
  try {
    const now = Date.now();
    const idOptionGroup = `og-${now}-${Math.random().toString(36).substring(7)}`;
    
    // Sanitize input
    const sanitizedDesc = data.optionGroupDesc.trim().substring(0, 255);
    const sortOrderValue = typeof data.sortOrder === 'number' ? data.sortOrder : 0;
    const sizingLinkValue = data.sizingLink === 1 ? 1 : 0;
    
    db.prepare(`
      INSERT INTO option_groups 
      (idOptionGroup, optionGroupDesc, optionReq, optionType, sizingLink, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      idOptionGroup,
      sanitizedDesc,
      data.optionReq,
      data.optionType,
      sizingLinkValue,
      sortOrderValue,
      now,
      now
    );
    
    return getOptionGroupById(idOptionGroup, true)!;
  } finally {
    db.close();
  }
}

/**
 * Update option group
 */
export function updateOptionGroup(idOptionGroup: string, data: Partial<OptionGroupFormData>): OptionGroup {
  // Validate ID format (defense in depth)
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    throw new Error('Invalid option group ID');
  }
  
  const db = getDb();
  
  try {
    const existing = db.prepare(`
      SELECT optionType 
      FROM option_groups 
      WHERE idOptionGroup = ?
    `).get(idOptionGroup) as { optionType: string } | undefined;

    if (!existing) {
      throw new Error('Option group not found');
    }

    const now = Date.now();
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.optionGroupDesc !== undefined) {
      if (typeof data.optionGroupDesc !== 'string' || data.optionGroupDesc.trim().length === 0) {
        throw new Error('Option group description is required');
      }
      updates.push('optionGroupDesc = ?');
      params.push(data.optionGroupDesc.trim().substring(0, 255));
    }
    if (data.optionReq !== undefined) {
      updates.push('optionReq = ?');
      params.push(data.optionReq);
    }
    if (data.optionType !== undefined) {
      updates.push('optionType = ?');
      params.push(data.optionType);
    }
    if (data.sizingLink !== undefined) {
      updates.push('sizingLink = ?');
      params.push(data.sizingLink === 1 ? 1 : 0);
    }
    if (data.sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      params.push(typeof data.sortOrder === 'number' ? data.sortOrder : 0);
    }

    const targetType = data.optionType ?? existing.optionType;
    if (targetType === 'T') {
      const stats = getOptionGroupStatsInternal(db, idOptionGroup);
      if (stats.optionCount > 1) {
        throw new Error('Text input option groups can only be linked to a single option. Remove extra options first.');
      }
    }
    
    updates.push('updatedAt = ?');
    params.push(now, idOptionGroup);
    
    db.prepare(`UPDATE option_groups SET ${updates.join(', ')} WHERE idOptionGroup = ?`).run(...params);
    
    return getOptionGroupById(idOptionGroup, true)!;
  } finally {
    db.close();
  }
}

/**
 * Delete option group
 */
export function deleteOptionGroup(idOptionGroup: string): boolean {
  // Validate ID format (defense in depth)
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    return false;
  }
  
  const db = getDb();
  
  try {
    const exists = db.prepare('SELECT 1 FROM option_groups WHERE idOptionGroup = ?').get(idOptionGroup);
    if (!exists) {
      return false;
    }

    const stats = getOptionGroupStatsInternal(db, idOptionGroup);
    if (stats.optionCount > 0) {
      throw new Error('Option group cannot be deleted while it still has options linked to it.');
    }
    if (stats.productCount > 0) {
      throw new Error('Option group cannot be deleted while it is assigned to products.');
    }

    const result = db.prepare('DELETE FROM option_groups WHERE idOptionGroup = ?').run(idOptionGroup);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ============================================================================
// OPTIONS CRUD
// ============================================================================

/**
 * Get all options
 */
export function getAllOptions(): Option[] {
  const db = getDb();
  
  try {
    const rows = db.prepare('SELECT * FROM options ORDER BY sortOrder, optionDescrip').all();
    return rows.map((row: any) => ({
      idOption: row.idOption,
      optionDescrip: row.optionDescrip,
      priceToAdd: row.priceToAdd,
      percToAdd: row.percToAdd,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } finally {
    db.close();
  }
}

/**
 * Get option by ID
 */
export function getOptionById(idOption: string): Option | null {
  // Validate ID format (defense in depth)
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    return null;
  }
  
  const db = getDb();
  
  try {
    const row = db.prepare('SELECT * FROM options WHERE idOption = ?').get(idOption);
    if (!row) return null;
    
    return {
      idOption: (row as any).idOption,
      optionDescrip: (row as any).optionDescrip,
      priceToAdd: (row as any).priceToAdd,
      percToAdd: (row as any).percToAdd,
      sortOrder: (row as any).sortOrder,
      createdAt: (row as any).createdAt,
      updatedAt: (row as any).updatedAt,
    };
  } finally {
    db.close();
  }
}

/**
 * Get options by group ID
 */
export function getOptionsByGroupId(idOptionGroup: string): Option[] {
  // Validate ID format (defense in depth)
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    return [];
  }
  
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT o.* 
      FROM options o
      INNER JOIN option_group_xref x ON o.idOption = x.idOption
      WHERE x.idOptionGroup = ?
      ORDER BY o.sortOrder, o.optionDescrip
    `).all(idOptionGroup);
    
    return rows.map((row: any) => ({
      idOption: row.idOption,
      optionDescrip: row.optionDescrip,
      priceToAdd: row.priceToAdd,
      percToAdd: row.percToAdd,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } finally {
    db.close();
  }
}

/**
 * Get options that are not linked to the specified option group
 */
export function getAvailableOptionsForGroup(idOptionGroup: string): Option[] {
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    return [];
  }

  const db = getDb();

  try {
    const rows = db.prepare(`
      SELECT o.*
      FROM options o
      WHERE NOT EXISTS (
        SELECT 1
        FROM option_group_xref x
        WHERE x.idOption = o.idOption
          AND x.idOptionGroup = ?
      )
      ORDER BY o.sortOrder, o.optionDescrip
    `).all(idOptionGroup);

    return rows.map((row: any) => ({
      idOption: row.idOption,
      optionDescrip: row.optionDescrip,
      priceToAdd: row.priceToAdd,
      percToAdd: row.percToAdd,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } finally {
    db.close();
  }
}

/**
 * Create option
 */
export function createOption(data: OptionFormData, idOptionGroup?: string): Option {
  // Validate option group ID if provided (defense in depth)
  if (idOptionGroup && (typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-'))) {
    throw new Error('Invalid option group ID');
  }
  
  const db = getDb();
  
  try {
    const now = Date.now();
    const idOption = `opt-${now}-${Math.random().toString(36).substring(7)}`;
    
    // Sanitize input
    const sanitizedDesc = data.optionDescrip.trim().substring(0, 255);
    
    db.prepare(`
      INSERT INTO options 
      (idOption, optionDescrip, priceToAdd, percToAdd, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      idOption,
      sanitizedDesc,
      data.priceToAdd,
      data.percToAdd,
      data.sortOrder,
      now,
      now
    );
    
    // Link to option group if provided
    if (idOptionGroup) {
      db.prepare(`
        INSERT INTO option_group_xref (idOptionGroup, idOption)
        VALUES (?, ?)
      `).run(idOptionGroup, idOption);
    }
    
    return getOptionById(idOption)!;
  } finally {
    db.close();
  }
}

/**
 * Update option
 */
export function updateOption(idOption: string, data: Partial<OptionFormData>): Option {
  // Validate ID format (defense in depth)
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    throw new Error('Invalid option ID');
  }
  
  const db = getDb();
  
  try {
    const now = Date.now();
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.optionDescrip !== undefined) {
      updates.push('optionDescrip = ?');
      params.push(data.optionDescrip);
    }
    if (data.priceToAdd !== undefined) {
      updates.push('priceToAdd = ?');
      params.push(data.priceToAdd);
    }
    if (data.percToAdd !== undefined) {
      updates.push('percToAdd = ?');
      params.push(data.percToAdd);
    }
    if (data.sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      params.push(data.sortOrder);
    }
    
    updates.push('updatedAt = ?');
    params.push(now, idOption);
    
    db.prepare(`UPDATE options SET ${updates.join(', ')} WHERE idOption = ?`).run(...params);
    
    return getOptionById(idOption)!;
  } finally {
    db.close();
  }
}

/**
 * Delete option
 */
export function deleteOption(idOption: string): boolean {
  // Validate ID format (defense in depth)
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    return false;
  }
  
  const db = getDb();
  
  try {
    const result = db.prepare('DELETE FROM options WHERE idOption = ?').run(idOption);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Add option to group
 */
export function addOptionToGroup(
  idOptionGroup: string,
  idOption: string,
  settings?: { excludeAll?: boolean }
): boolean {
  // Validate inputs (defense in depth)
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    throw new Error('Invalid option group ID');
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    throw new Error('Invalid option ID');
  }
  
  const db = getDb();
  
  try {
    const group = db.prepare(`
      SELECT optionType
      FROM option_groups
      WHERE idOptionGroup = ?
    `).get(idOptionGroup) as { optionType: string } | undefined;

    if (!group) {
      throw new Error('Option group not found');
    }

    const optionExists = db.prepare(`
      SELECT 1
      FROM options
      WHERE idOption = ?
    `).get(idOption) as { 1: number } | undefined;

    if (!optionExists) {
      throw new Error('Option not found');
    }

    const existingLink = db.prepare(`
      SELECT 1
      FROM option_group_xref
      WHERE idOptionGroup = ?
        AND idOption = ?
    `).get(idOptionGroup, idOption);

    if (existingLink) {
      throw new Error('Option is already linked to this group.');
    }

    if (group.optionType === 'T') {
      const stats = getOptionGroupStatsInternal(db, idOptionGroup);
      if (stats.optionCount >= 1) {
        throw new Error('Text input option groups can only have one option. Remove the existing option first.');
      }
    }

    const insertResult = db.prepare(`
      INSERT INTO option_group_xref (idOptionGroup, idOption)
      VALUES (?, ?)
    `).run(idOptionGroup, idOption);

    if (insertResult.changes === 0) {
      return false;
    }

    if (settings?.excludeAll) {
      const products = db.prepare(`
        SELECT idProduct
        FROM product_option_groups
        WHERE idOptionGroup = ?
      `).all(idOptionGroup) as Array<{ idProduct: string }>;

      if (products.length > 0) {
        const excludeStmt = db.prepare(`
          INSERT OR IGNORE INTO product_option_exclusions (id, idProduct, idOption, createdAt)
          VALUES (?, ?, ?, ?)
        `);

        for (const product of products) {
          const excludeId = `excl-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          excludeStmt.run(excludeId, product.idProduct, idOption, Date.now());
        }
      }
    }

    return true;
  } finally {
    db.close();
  }
}

/**
 * Remove option from group
 */
export function removeOptionFromGroup(idOptionGroup: string, idOption: string): boolean {
  // Validate inputs (defense in depth)
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    return false;
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    return false;
  }
  
  const db = getDb();
  
  try {
    const result = db.prepare(`
      DELETE FROM option_group_xref 
      WHERE idOptionGroup = ? AND idOption = ?
    `).run(idOptionGroup, idOption);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT OPTION GROUPS
// ============================================================================

/**
 * Get option groups for a product
 */
export function getProductOptionGroups(idProduct: string): ProductOptionGroupWithOptions[] {
  // Validate product ID format (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    return [];
  }
  
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT 
        og.*,
        pog.id as pogId,
        pog.createdAt as pogCreatedAt
      FROM product_option_groups pog
      INNER JOIN option_groups og ON pog.idOptionGroup = og.idOptionGroup
      WHERE pog.idProduct = ?
      ORDER BY og.sortOrder, og.optionGroupDesc
    `).all(idProduct);
    
    const optionGroups: ProductOptionGroupWithOptions[] = [];
    
    for (const row of rows as any[]) {
      // Get options for this group
      const options = getOptionsByGroupId(row.idOptionGroup);
      
      // Get excluded options for this product
      const excludedRows = db.prepare(`
        SELECT idOption FROM product_option_exclusions
        WHERE idProduct = ? AND idOption IN (
          SELECT idOption FROM option_group_xref WHERE idOptionGroup = ?
        )
      `).all(idProduct, row.idOptionGroup);
      
      const excludedOptions = excludedRows.map((r: any) => r.idOption);
      
      // Filter out excluded options
      const availableOptions = options.filter(opt => !excludedOptions.includes(opt.idOption));
      
      optionGroups.push({
        idOptionGroup: row.idOptionGroup,
        optionGroupDesc: row.optionGroupDesc,
        optionReq: row.optionReq,
        optionType: row.optionType,
        sizingLink: row.sizingLink,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        options: availableOptions,
        excludedOptions,
      });
    }
    
    return optionGroups;
  } finally {
    db.close();
  }
}

/**
 * Assign option group to product
 */
export function assignOptionGroupToProduct(
  idProduct: string,
  assignment: ProductOptionGroupAssignment
): ProductOptionGroup {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    throw new Error('Invalid product ID');
  }
  if (!assignment.idOptionGroup || typeof assignment.idOptionGroup !== 'string' || !assignment.idOptionGroup.startsWith('og-')) {
    throw new Error('Invalid option group ID');
  }
  if (assignment.excludedOptions && !Array.isArray(assignment.excludedOptions)) {
    throw new Error('Excluded options must be an array');
  }
  
  const db = getDb();
  
  try {
    const now = Date.now();
    const id = `pog-${now}-${Math.random().toString(36).substring(7)}`;
    
    // Insert product option group link
    db.prepare(`
      INSERT OR REPLACE INTO product_option_groups (id, idProduct, idOptionGroup, createdAt)
      VALUES (?, ?, ?, ?)
    `).run(id, idProduct, assignment.idOptionGroup, now);
    
    // Validate excluded option IDs
    const validExcludedOptions = assignment.excludedOptions
      ? assignment.excludedOptions.filter((optId: string) => 
          typeof optId === 'string' && optId.startsWith('opt-')
        )
      : [];
    
    // Handle exclusions
    if (validExcludedOptions.length > 0) {
      // Remove old exclusions for this product and option group
      db.prepare(`
        DELETE FROM product_option_exclusions
        WHERE idProduct = ? AND idOption IN (
          SELECT idOption FROM option_group_xref WHERE idOptionGroup = ?
        )
      `).run(idProduct, assignment.idOptionGroup);
      
      // Add new exclusions
      const excludeStmt = db.prepare(`
        INSERT INTO product_option_exclusions (id, idProduct, idOption, createdAt)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const idOption of validExcludedOptions) {
        const excludeId = `excl-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        excludeStmt.run(excludeId, idProduct, idOption, now);
      }
    }
    
    return {
      id,
      idProduct,
      idOptionGroup: assignment.idOptionGroup,
      createdAt: now,
    };
  } finally {
    db.close();
  }
}

/**
 * Remove option group from product
 */
export function removeOptionGroupFromProduct(idProduct: string, idOptionGroup: string): boolean {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    return false;
  }
  if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
    return false;
  }
  
  const db = getDb();
  
  try {
    const result = db.prepare(`
      DELETE FROM product_option_groups
      WHERE idProduct = ? AND idOptionGroup = ?
    `).run(idProduct, idOptionGroup);
    
    // Also remove exclusions for this option group
    db.prepare(`
      DELETE FROM product_option_exclusions
      WHERE idProduct = ? AND idOption IN (
        SELECT idOption FROM option_group_xref WHERE idOptionGroup = ?
      )
    `).run(idProduct, idOptionGroup);
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT OPTION INVENTORY
// ============================================================================

/**
 * Get option inventory for a product
 */
export function getProductOptionInventory(idProduct: string): ProductOptionInventory[] {
  // Validate product ID format (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    return [];
  }
  
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT * FROM product_option_inventory
      WHERE idProduct = ?
      ORDER BY createdAt
    `).all(idProduct);
    
    return rows.map((row: any) => ({
      id: row.id,
      idProduct: row.idProduct,
      idOption: row.idOption,
      stock: row.stock,
      actualInventory: row.actualInventory,
      ignoreStock: row.ignoreStock,
      unavailable: row.unavailable,
      blocked: row.blocked,
      reasonCode: row.reasonCode,
      dropShip: row.dropShip,
      specialOrder: row.specialOrder,
      updateCPStock: row.updateCPStock,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } finally {
    db.close();
  }
}

/**
 * Get option inventory for a specific product+option
 */
export function getProductOptionInventoryByOption(
  idProduct: string,
  idOption: string
): ProductOptionInventory | null {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    return null;
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    return null;
  }
  
  const db = getDb();
  
  try {
    const row = db.prepare(`
      SELECT * FROM product_option_inventory
      WHERE idProduct = ? AND idOption = ?
    `).get(idProduct, idOption);
    
    if (!row) return null;
    
    return {
      id: (row as any).id,
      idProduct: (row as any).idProduct,
      idOption: (row as any).idOption,
      stock: (row as any).stock,
      actualInventory: (row as any).actualInventory,
      ignoreStock: (row as any).ignoreStock,
      unavailable: (row as any).unavailable,
      blocked: (row as any).blocked,
      reasonCode: (row as any).reasonCode,
      dropShip: (row as any).dropShip,
      specialOrder: (row as any).specialOrder,
      updateCPStock: (row as any).updateCPStock,
      createdAt: (row as any).createdAt,
      updatedAt: (row as any).updatedAt,
    };
  } finally {
    db.close();
  }
}

/**
 * Set option inventory for a product+option
 */
export function setProductOptionInventory(
  idProduct: string,
  idOption: string,
  inventory: Partial<ProductOptionInventory>
): ProductOptionInventory {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    throw new Error('Invalid product ID');
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    throw new Error('Invalid option ID');
  }
  
  const db = getDb();
  
  try {
    const now = Date.now();
    const existing = getProductOptionInventoryByOption(idProduct, idOption);
    
    if (existing) {
      // Update existing
      const updates: string[] = [];
      const params: any[] = [];
      
      if (inventory.stock !== undefined) {
        updates.push('stock = ?');
        params.push(inventory.stock);
      }
      if (inventory.actualInventory !== undefined) {
        updates.push('actualInventory = ?');
        params.push(inventory.actualInventory);
      }
      if (inventory.ignoreStock !== undefined) {
        updates.push('ignoreStock = ?');
        params.push(inventory.ignoreStock);
      }
      if (inventory.unavailable !== undefined) {
        updates.push('unavailable = ?');
        params.push(inventory.unavailable);
      }
      if (inventory.blocked !== undefined) {
        updates.push('blocked = ?');
        params.push(inventory.blocked);
      }
      if (inventory.reasonCode !== undefined) {
        updates.push('reasonCode = ?');
        params.push(inventory.reasonCode);
      }
      if (inventory.dropShip !== undefined) {
        updates.push('dropShip = ?');
        params.push(inventory.dropShip);
      }
      if (inventory.specialOrder !== undefined) {
        updates.push('specialOrder = ?');
        params.push(inventory.specialOrder);
      }
      if (inventory.updateCPStock !== undefined) {
        updates.push('updateCPStock = ?');
        params.push(inventory.updateCPStock);
      }
      
      updates.push('updatedAt = ?');
      params.push(now, existing.id);
      
      db.prepare(`UPDATE product_option_inventory SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      
      return getProductOptionInventoryByOption(idProduct, idOption)!;
    } else {
      // Create new
      const id = `poi-${now}-${Math.random().toString(36).substring(7)}`;
      
      db.prepare(`
        INSERT INTO product_option_inventory (
          id, idProduct, idOption, stock, actualInventory, ignoreStock,
          unavailable, blocked, reasonCode, dropShip, specialOrder, updateCPStock,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        idProduct,
        idOption,
        inventory.stock ?? 0,
        inventory.actualInventory ?? 0,
        inventory.ignoreStock ?? 0,
        inventory.unavailable ?? 0,
        inventory.blocked ?? 0,
        inventory.reasonCode ?? null,
        inventory.dropShip ?? 0,
        inventory.specialOrder ?? 0,
        inventory.updateCPStock ?? 0,
        now,
        now
      );
      
      return getProductOptionInventoryByOption(idProduct, idOption)!;
    }
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT OPTION IMAGES
// ============================================================================

/**
 * Get option image for a product+option
 */
export function getProductOptionImage(
  idProduct: string,
  idOption: string
): ProductOptionImage | null {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    return null;
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    return null;
  }
  
  const db = getDb();
  
  try {
    const row = db.prepare(`
      SELECT * FROM product_option_images
      WHERE idProduct = ? AND idOption = ?
    `).get(idProduct, idOption);
    
    if (!row) return null;
    
    return {
      id: (row as any).id,
      idProduct: (row as any).idProduct,
      idOption: (row as any).idOption,
      optionImageUrl: (row as any).optionImageUrl,
      sortOrder: (row as any).sortOrder,
      createdAt: (row as any).createdAt,
    };
  } finally {
    db.close();
  }
}

/**
 * Set option image for a product+option
 */
export function setProductOptionImage(
  idProduct: string,
  idOption: string,
  optionImageUrl: string
): ProductOptionImage {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    throw new Error('Invalid product ID');
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    throw new Error('Invalid option ID');
  }
  if (!optionImageUrl || typeof optionImageUrl !== 'string' || optionImageUrl.length > 2048) {
    throw new Error('Invalid image URL');
  }
  
  const db = getDb();
  
  try {
    const now = Date.now();
    const existing = getProductOptionImage(idProduct, idOption);
    
    if (existing) {
      db.prepare(`
        UPDATE product_option_images
        SET optionImageUrl = ?
        WHERE idProduct = ? AND idOption = ?
      `).run(optionImageUrl, idProduct, idOption);
      
      return getProductOptionImage(idProduct, idOption)!;
    } else {
      const id = `poimg-${now}-${Math.random().toString(36).substring(7)}`;
      
      db.prepare(`
        INSERT INTO product_option_images (id, idProduct, idOption, optionImageUrl, sortOrder, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, idProduct, idOption, optionImageUrl, 0, now);
      
      return getProductOptionImage(idProduct, idOption)!;
    }
  } finally {
    db.close();
  }
}

/**
 * Remove option image for a product+option
 */
export function removeProductOptionImage(idProduct: string, idOption: string): boolean {
  // Validate inputs (defense in depth)
  if (!idProduct || typeof idProduct !== 'string') {
    return false;
  }
  if (!idOption || typeof idOption !== 'string' || !idOption.startsWith('opt-')) {
    return false;
  }
  
  const db = getDb();
  
  try {
    const result = db.prepare(`
      DELETE FROM product_option_images
      WHERE idProduct = ? AND idOption = ?
    `).run(idProduct, idOption);
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT OPTIONS WITH INVENTORY (COMPLETE DATA)
// ============================================================================

/**
 * Get product options with inventory and images for a product
 */
export function getProductOptionsWithInventory(
  idProduct: string
): Record<string, ProductOptionWithInventory[]> {
  const db = getDb();
  
  try {
    const optionGroups = getProductOptionGroups(idProduct);
    const inventory = getProductOptionInventory(idProduct);
    const result: Record<string, ProductOptionWithInventory[]> = {};
    
    for (const group of optionGroups) {
      const optionsWithInventory: ProductOptionWithInventory[] = [];
      
      for (const option of group.options) {
        const inv = inventory.find(i => i.idOption === option.idOption);
        const img = getProductOptionImage(idProduct, option.idOption);
        
        const available = !inv || (
          inv.ignoreStock === 1 ||
          (inv.unavailable === 0 && inv.blocked === 0 && (inv.ignoreStock === 1 || inv.stock > 0))
        );
        
        optionsWithInventory.push({
          ...option,
          inventory: inv,
          image: img || undefined,
          available,
          unavailable: inv?.unavailable === 1,
          blocked: inv?.blocked === 1,
        });
      }
      
      result[group.idOptionGroup] = optionsWithInventory;
    }
    
    return result;
  } finally {
    db.close();
  }
}

