/**
 * Admin Role-Based Permissions Database Functions
 * Provides database access for admin user management, roles, and permissions
 * NOTE: This module uses better-sqlite3 which only works server-side.
 * These functions will error if called from client components.
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AdminRole {
  id: number
  name: string
  description: string | null
  created_at: number
  updated_at: number
}

export interface AdminPermission {
  id: number
  name: string
  description: string
  permission_group: string
  sort_order: number
  created_at: number
}

export interface Admin {
  id: number
  user_id: string
  role_id: number
  sales_code_id: number | null
  is_enabled: number
  require_2fa: number
  last_login_at: number | null
  last_password_change: number | null
  password_expires_at: number | null
  created_at: number
  updated_at: number
}

export interface AdminWithDetails extends Admin {
  email: string
  name: string | null
  role_name: string
  sales_code: string | null
  sales_name: string | null
}

export interface RolePermission {
  role_id: number
  permission_id: number
  permission_name: string
  permission_level: number
}

export interface UserPermission {
  admin_id: number
  permission_id: number
  permission_name: string
  permission_level: number
}

export interface SalesCode {
  id: number
  code: string
  name: string
  active: number
  created_at: number
  updated_at: number
}

export interface FailedLogin {
  id: number
  email: string
  ip_address: string | null
  user_agent: string | null
  reason: string | null
  created_at: number
}

export interface AuditLogEntry {
  id?: number
  admin_id: number | null
  user_id: string | null
  action: string
  resource: string | null
  resource_id: string | null
  status: 'success' | 'failure'
  ip_address: string | null
  user_agent: string | null
  details: string | null
  error: string | null
  created_at: number
}

// Permission levels
export const PERMISSION_LEVEL = {
  NO_ACCESS: -1,
  READ_ONLY: 0,
  FULL_CONTROL: 1,
  RESTRICTED: 2,
} as const

// ============================================================================
// Admin User Functions
// ============================================================================

/**
 * Get admin by user ID
 */
export function getAdminByUserId(userId: string): AdminWithDetails | null {
  try {
    // First, just check if the admin record exists
    const checkStmt = db.prepare('SELECT * FROM admins WHERE user_id = ?');
    const adminRecord = checkStmt.get(userId);
    
    if (!adminRecord) {
      return null;
    }
    
    // The user table is in auth.db, not filtersfast.db, so we can't JOIN them
    // Let's just return the admin data without the user email/name for now
    const stmt = db.prepare(`
      SELECT 
        a.*,
        r.name as role_name,
        s.code as sales_code,
        s.name as sales_name
      FROM admins a
      LEFT JOIN admin_roles r ON a.role_id = r.id
      LEFT JOIN sales_codes s ON a.sales_code_id = s.id
      WHERE a.user_id = ?
    `)
    
    const result = stmt.get(userId) as any;
    
    // Add placeholder email/name since we can't query auth.db from here
    if (result) {
      result.email = 'admin@filtersfast.com'; // Placeholder
      result.name = 'Admin User'; // Placeholder
    }
    
    return result as AdminWithDetails | null
  } catch (error) {
    console.error('[getAdminByUserId] Database error');
    return null;
  }
}

/**
 * Get admin by ID
 */
export function getAdminById(adminId: number): AdminWithDetails | null {
  try {
    const stmt = db.prepare(`
      SELECT 
        a.*,
        r.name as role_name,
        s.code as sales_code,
        s.name as sales_name
      FROM admins a
      LEFT JOIN admin_roles r ON a.role_id = r.id
      LEFT JOIN sales_codes s ON a.sales_code_id = s.id
      WHERE a.id = ?
    `)
    
    const admin = stmt.get(adminId) as any
    
    if (!admin) {
      return null;
    }
    
    // Get email and name from auth.db
    const authDb = new Database('auth.db')
    const user = authDb.prepare('SELECT email, name FROM user WHERE id = ?').get(admin.user_id) as any
    authDb.close()
    
    const result = {
      ...admin,
      email: user?.email || 'unknown',
      name: user?.name || 'Unknown User'
    } as AdminWithDetails
    
    return result;
  } catch (error) {
    console.error('[getAdminById] Database error');
    throw error;
  }
}

/**
 * Get all admins
 */
export function getAllAdmins(includeDisabled = false): AdminWithDetails[] {
  const whereClause = includeDisabled ? '' : 'WHERE a.is_enabled = 1'
  
  // Query only from filtersfast.db (can't JOIN with auth.db user table)
  const stmt = db.prepare(`
    SELECT 
      a.*,
      r.name as role_name,
      s.code as sales_code,
      s.name as sales_name
    FROM admins a
    LEFT JOIN admin_roles r ON a.role_id = r.id
    LEFT JOIN sales_codes s ON a.sales_code_id = s.id
    ${whereClause}
    ORDER BY r.name, a.user_id
  `)
  
  const admins = stmt.all() as any[]
  
  // Add email and name from auth.db separately
  const authDb = new Database('auth.db')
  const userStmt = authDb.prepare('SELECT id, email, name FROM user WHERE id = ?')
  
  const results = admins.map(admin => {
    const user = userStmt.get(admin.user_id) as any
    return {
      ...admin,
      email: user?.email || 'unknown',
      name: user?.name || 'Unknown User'
    }
  })
  
  authDb.close()
  
  return results as AdminWithDetails[]
}

/**
 * Create admin user
 */
export function createAdmin(data: {
  user_id: string
  role_id: number
  sales_code_id?: number
  require_2fa?: boolean
}): number {
  const stmt = db.prepare(`
    INSERT INTO admins (user_id, role_id, sales_code_id, require_2fa, is_enabled)
    VALUES (?, ?, ?, ?, 1)
  `)
  
  const result = stmt.run(
    data.user_id,
    data.role_id,
    data.sales_code_id || null,
    data.require_2fa ? 1 : 1 // Default to requiring 2FA
  )
  
  return result.lastInsertRowid as number
}

/**
 * Update admin user
 */
export function updateAdmin(adminId: number, data: {
  role_id?: number
  sales_code_id?: number | null
  is_enabled?: boolean
  require_2fa?: boolean
}): boolean {
  const updates: string[] = []
  const values: any[] = []
  
  if (data.role_id !== undefined) {
    updates.push('role_id = ?')
    values.push(data.role_id)
  }
  
  if (data.sales_code_id !== undefined) {
    updates.push('sales_code_id = ?')
    values.push(data.sales_code_id)
  }
  
  if (data.is_enabled !== undefined) {
    updates.push('is_enabled = ?')
    values.push(data.is_enabled ? 1 : 0)
  }
  
  if (data.require_2fa !== undefined) {
    updates.push('require_2fa = ?')
    values.push(data.require_2fa ? 1 : 0)
  }
  
  if (updates.length === 0) return false
  
  updates.push('updated_at = unixepoch()')
  values.push(adminId)
  
  const stmt = db.prepare(`
    UPDATE admins 
    SET ${updates.join(', ')}
    WHERE id = ?
  `)
  
  const result = stmt.run(...values)
  return result.changes > 0
}

/**
 * Update admin last login
 */
export function updateAdminLastLogin(adminId: number): boolean {
  const stmt = db.prepare(`
    UPDATE admins 
    SET last_login_at = unixepoch()
    WHERE id = ?
  `)
  
  const result = stmt.run(adminId)
  return result.changes > 0
}

/**
 * Update admin password change timestamp
 */
export function updateAdminPasswordChange(adminId: number): boolean {
  // Password expires after 90 days
  const expiresAt = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
  
  const stmt = db.prepare(`
    UPDATE admins 
    SET last_password_change = unixepoch(),
        password_expires_at = ?
    WHERE id = ?
  `)
  
  const result = stmt.run(expiresAt, adminId)
  return result.changes > 0
}

/**
 * Delete admin user (soft delete by disabling)
 */
export function deleteAdmin(adminId: number): boolean {
  const stmt = db.prepare(`
    UPDATE admins 
    SET is_enabled = 0,
        updated_at = unixepoch()
    WHERE id = ?
  `)
  
  const result = stmt.run(adminId)
  return result.changes > 0
}

// ============================================================================
// Role Functions
// ============================================================================

/**
 * Get all roles
 */
export function getAllRoles(): AdminRole[] {
  const stmt = db.prepare(`
    SELECT * FROM admin_roles
    ORDER BY name
  `)
  
  return stmt.all() as AdminRole[]
}

/**
 * Get role by ID
 */
export function getRoleById(roleId: number): AdminRole | null {
  const stmt = db.prepare(`
    SELECT * FROM admin_roles WHERE id = ?
  `)
  
  return stmt.get(roleId) as AdminRole | null
}

/**
 * Create role
 */
export function createRole(name: string, description?: string): number {
  const stmt = db.prepare(`
    INSERT INTO admin_roles (name, description)
    VALUES (?, ?)
  `)
  
  const result = stmt.run(name, description || null)
  return result.lastInsertRowid as number
}

/**
 * Update role
 */
export function updateRole(roleId: number, name: string, description?: string): boolean {
  const stmt = db.prepare(`
    UPDATE admin_roles 
    SET name = ?, description = ?, updated_at = unixepoch()
    WHERE id = ?
  `)
  
  const result = stmt.run(name, description || null, roleId)
  return result.changes > 0
}

/**
 * Delete role (if no admins are assigned)
 */
export function deleteRole(roleId: number): boolean {
  // Check if any admins have this role
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM admins WHERE role_id = ?')
  const result = checkStmt.get(roleId) as { count: number }
  
  if (result.count > 0) {
    throw new Error('Cannot delete role with assigned admins')
  }
  
  const stmt = db.prepare('DELETE FROM admin_roles WHERE id = ?')
  const deleteResult = stmt.run(roleId)
  return deleteResult.changes > 0
}

// ============================================================================
// Permission Functions
// ============================================================================

/**
 * Get all permissions
 */
export function getAllPermissions(): AdminPermission[] {
  const stmt = db.prepare(`
    SELECT * FROM admin_permissions
    ORDER BY permission_group, sort_order
  `)
  
  return stmt.all() as AdminPermission[]
}

/**
 * Get permissions by group
 */
export function getPermissionsByGroup(): Record<string, AdminPermission[]> {
  const permissions = getAllPermissions()
  const grouped: Record<string, AdminPermission[]> = {}
  
  for (const perm of permissions) {
    if (!grouped[perm.permission_group]) {
      grouped[perm.permission_group] = []
    }
    grouped[perm.permission_group].push(perm)
  }
  
  return grouped
}

/**
 * Get permission by name
 */
export function getPermissionByName(name: string): AdminPermission | null {
  const stmt = db.prepare(`
    SELECT * FROM admin_permissions WHERE name = ?
  `)
  
  return stmt.get(name) as AdminPermission | null
}

/**
 * Ensure a permission exists with default role levels
 */
export function ensurePermissionSeeded(
  permissionName: string,
  description: string,
  permissionGroup: string,
  sortOrder: number,
  roleDefaults: Record<string, number> = {}
): void {
  try {
    let permission = getPermissionByName(permissionName)
    let permissionId: number

    if (!permission) {
      const insertStmt = db.prepare(`
        INSERT INTO admin_permissions (name, description, permission_group, sort_order, created_at)
        VALUES (?, ?, ?, ?, unixepoch())
      `)
      const result = insertStmt.run(permissionName, description, permissionGroup, sortOrder)
      permissionId = Number(result.lastInsertRowid)
    } else {
      permissionId = permission.id

      // Keep metadata in sync if it changed
      const updateStmt = db.prepare(`
        UPDATE admin_permissions
        SET description = ?, permission_group = ?, sort_order = ?
        WHERE id = ?
      `)
      updateStmt.run(description, permissionGroup, sortOrder, permissionId)
    }

    if (Object.keys(roleDefaults).length > 0) {
      const roles = db.prepare('SELECT id, name FROM admin_roles').all() as Array<{ id: number; name: string }>
      for (const role of roles) {
        const desiredLevel = roleDefaults[role.name]
        if (typeof desiredLevel === 'number') {
          setRolePermission(role.id, permissionId, desiredLevel)
        }
      }
    }
  } catch (error) {
    console.error(`[ensurePermissionSeeded] Failed for permission "${permissionName}":`, error)
  }
}

// ============================================================================
// Role Permission Functions
// ============================================================================

/**
 * Get permissions for a role
 */
export function getRolePermissions(roleId: number): RolePermission[] {
  const stmt = db.prepare(`
    SELECT 
      rp.*,
      p.name as permission_name
    FROM admin_role_permissions rp
    LEFT JOIN admin_permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
    ORDER BY p.permission_group, p.sort_order
  `)
  
  return stmt.all(roleId) as RolePermission[]
}

/**
 * Set role permission
 */
export function setRolePermission(roleId: number, permissionId: number, level: number): boolean {
  const stmt = db.prepare(`
    INSERT INTO admin_role_permissions (role_id, permission_id, permission_level)
    VALUES (?, ?, ?)
    ON CONFLICT(role_id, permission_id) 
    DO UPDATE SET permission_level = ?
  `)
  
  const result = stmt.run(roleId, permissionId, level, level)
  return result.changes > 0
}

/**
 * Remove role permission
 */
export function removeRolePermission(roleId: number, permissionId: number): boolean {
  const stmt = db.prepare(`
    DELETE FROM admin_role_permissions 
    WHERE role_id = ? AND permission_id = ?
  `)
  
  const result = stmt.run(roleId, permissionId)
  return result.changes > 0
}

/**
 * Clear all permissions for a role
 */
export function clearRolePermissions(roleId: number): boolean {
  const stmt = db.prepare(`
    DELETE FROM admin_role_permissions WHERE role_id = ?
  `)
  
  const result = stmt.run(roleId)
  return result.changes > 0
}

// ============================================================================
// User Permission Functions (Overrides)
// ============================================================================

/**
 * Get permission overrides for a user
 */
export function getUserPermissions(adminId: number): UserPermission[] {
  const stmt = db.prepare(`
    SELECT 
      up.*,
      p.name as permission_name
    FROM admin_user_permissions up
    LEFT JOIN admin_permissions p ON up.permission_id = p.id
    WHERE up.admin_id = ?
  `)
  
  return stmt.all(adminId) as UserPermission[]
}

/**
 * Set user permission override
 */
export function setUserPermission(adminId: number, permissionId: number, level: number): boolean {
  const stmt = db.prepare(`
    INSERT INTO admin_user_permissions (admin_id, permission_id, permission_level)
    VALUES (?, ?, ?)
    ON CONFLICT(admin_id, permission_id) 
    DO UPDATE SET permission_level = ?
  `)
  
  const result = stmt.run(adminId, permissionId, level, level)
  return result.changes > 0
}

/**
 * Remove user permission override
 */
export function removeUserPermission(adminId: number, permissionId: number): boolean {
  const stmt = db.prepare(`
    DELETE FROM admin_user_permissions 
    WHERE admin_id = ? AND permission_id = ?
  `)
  
  const result = stmt.run(adminId, permissionId)
  return result.changes > 0
}

/**
 * Get effective permissions for an admin (role + user overrides)
 */
export function getEffectivePermissions(adminId: number): Map<string, number> {
  const admin = getAdminById(adminId)
  if (!admin) return new Map()
  
  // Start with role permissions
  const rolePerms = getRolePermissions(admin.role_id)
  const permMap = new Map<string, number>()
  
  for (const perm of rolePerms) {
    permMap.set(perm.permission_name, perm.permission_level)
  }
  
  // Apply user-specific overrides
  const userPerms = getUserPermissions(adminId)
  for (const perm of userPerms) {
    permMap.set(perm.permission_name, perm.permission_level)
  }
  
  return permMap
}

/**
 * Check if admin has permission
 */
export function hasPermission(
  adminId: number, 
  permissionName: string, 
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY
): boolean {
  const permissions = getEffectivePermissions(adminId)
  const level = permissions.get(permissionName)
  
  if (level === undefined || level === PERMISSION_LEVEL.NO_ACCESS) {
    return false
  }
  
  return level >= requiredLevel
}

// ============================================================================
// Sales Code Functions
// ============================================================================

/**
 * Get all sales codes
 */
export function getAllSalesCodes(activeOnly = true): SalesCode[] {
  const whereClause = activeOnly ? 'WHERE active = 1' : ''
  
  const stmt = db.prepare(`
    SELECT * FROM sales_codes
    ${whereClause}
    ORDER BY name
  `)
  
  return stmt.all() as SalesCode[]
}

/**
 * Get sales code by ID
 */
export function getSalesCodeById(id: number): SalesCode | null {
  const stmt = db.prepare(`
    SELECT * FROM sales_codes WHERE id = ?
  `)
  
  return stmt.get(id) as SalesCode | null
}

/**
 * Create sales code
 */
export function createSalesCode(code: string, name: string): number {
  const stmt = db.prepare(`
    INSERT INTO sales_codes (code, name, active)
    VALUES (?, ?, 1)
  `)
  
  const result = stmt.run(code, name)
  return result.lastInsertRowid as number
}

/**
 * Update sales code
 */
export function updateSalesCode(id: number, code: string, name: string, active: boolean): boolean {
  const stmt = db.prepare(`
    UPDATE sales_codes 
    SET code = ?, name = ?, active = ?, updated_at = unixepoch()
    WHERE id = ?
  `)
  
  const result = stmt.run(code, name, active ? 1 : 0, id)
  return result.changes > 0
}

// ============================================================================
// Password History Functions
// ============================================================================

/**
 * Add password to history
 */
export function addPasswordHistory(adminId: number, passwordHash: string): void {
  const stmt = db.prepare(`
    INSERT INTO password_history (admin_id, password_hash)
    VALUES (?, ?)
  `)
  
  stmt.run(adminId, passwordHash)
  
  // Keep only last 5 passwords
  const cleanupStmt = db.prepare(`
    DELETE FROM password_history
    WHERE admin_id = ?
    AND id NOT IN (
      SELECT id FROM password_history
      WHERE admin_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    )
  `)
  
  cleanupStmt.run(adminId, adminId)
}

/**
 * Check if password was recently used
 */
export function isPasswordReused(adminId: number, passwordHash: string): boolean {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM password_history
    WHERE admin_id = ? AND password_hash = ?
    ORDER BY created_at DESC
    LIMIT 5
  `)
  
  const result = stmt.get(adminId, passwordHash) as { count: number }
  return result.count > 0
}

// ============================================================================
// Failed Login Functions
// ============================================================================

/**
 * Log failed login attempt
 */
export function logFailedLogin(
  email: string, 
  ipAddress?: string, 
  userAgent?: string, 
  reason?: string
): void {
  const stmt = db.prepare(`
    INSERT INTO failed_logins (email, ip_address, user_agent, reason)
    VALUES (?, ?, ?, ?)
  `)
  
  stmt.run(email, ipAddress || null, userAgent || null, reason || null)
}

/**
 * Get failed login attempts
 */
export function getFailedLogins(limit = 100, email?: string): FailedLogin[] {
  let query = 'SELECT * FROM failed_logins'
  const params: any[] = []
  
  if (email) {
    query += ' WHERE email = ?'
    params.push(email)
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?'
  params.push(limit)
  
  const stmt = db.prepare(query)
  return stmt.all(...params) as FailedLogin[]
}

/**
 * Get recent failed login count for email
 */
export function getRecentFailedLoginCount(email: string, minutesAgo = 15): number {
  const timestamp = Math.floor(Date.now() / 1000) - (minutesAgo * 60)
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM failed_logins
    WHERE email = ? AND created_at > ?
  `)
  
  const result = stmt.get(email, timestamp) as { count: number }
  return result.count
}

/**
 * Clear old failed login records
 */
export function clearOldFailedLogins(daysAgo = 30): number {
  const timestamp = Math.floor(Date.now() / 1000) - (daysAgo * 24 * 60 * 60)
  
  const stmt = db.prepare(`
    DELETE FROM failed_logins WHERE created_at < ?
  `)
  
  const result = stmt.run(timestamp)
  return result.changes
}

// ============================================================================
// Audit Log Functions
// ============================================================================

/**
 * Add audit log entry
 */
export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO admin_audit_log (
        admin_id, user_id, action, resource, resource_id, 
        status, ip_address, user_agent, details, error
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      entry.admin_id,
      entry.user_id,
      entry.action,
      entry.resource,
      entry.resource_id,
      entry.status,
      entry.ip_address,
      entry.user_agent,
      entry.details,
      entry.error
    )
    
    return result.lastInsertRowid as number
  } catch (error) {
    console.error('[addAuditLog] Failed to add audit log entry');
    // Don't throw - audit logging failures shouldn't break the request
    return -1
  }
}

/**
 * Get audit logs
 */
export function getAuditLogs(filters?: {
  admin_id?: number
  action?: string
  resource?: string
  status?: string
  limit?: number
  offset?: number
}): AuditLogEntry[] {
  let query = 'SELECT * FROM admin_audit_log WHERE 1=1'
  const params: any[] = []
  
  if (filters?.admin_id) {
    query += ' AND admin_id = ?'
    params.push(filters.admin_id)
  }
  
  if (filters?.action) {
    query += ' AND action = ?'
    params.push(filters.action)
  }
  
  if (filters?.resource) {
    query += ' AND resource = ?'
    params.push(filters.resource)
  }
  
  if (filters?.status) {
    query += ' AND status = ?'
    params.push(filters.status)
  }
  
  query += ' ORDER BY created_at DESC'
  
  if (filters?.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
    
    if (filters?.offset) {
      query += ' OFFSET ?'
      params.push(filters.offset)
    }
  }
  
  const stmt = db.prepare(query)
  return stmt.all(...params) as AuditLogEntry[]
}

/**
 * Clear old audit logs
 */
export function clearOldAuditLogs(daysAgo = 90): number {
  const timestamp = Math.floor(Date.now() / 1000) - (daysAgo * 24 * 60 * 60)
  
  const stmt = db.prepare(`
    DELETE FROM admin_audit_log WHERE created_at < ?
  `)
  
  const result = stmt.run(timestamp)
  return result.changes
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get database instance (for custom queries)
 */
export function getDatabase(): Database.Database {
  return db
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close()
}

