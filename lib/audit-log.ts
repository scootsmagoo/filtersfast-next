/**
 * Audit Logging Utility
 * 
 * Logs security-relevant events for compliance and monitoring
 */

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  error?: string;
}

// In-memory store (replace with database in production)
const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 10000; // Keep last 10k logs in memory

/**
 * Log an audit event
 */
export async function auditLog(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };
  
  // Add to in-memory store
  auditLogs.push(logEntry);
  
  // Keep only recent logs
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.shift();
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
  }
  
  // In production, send to logging service (Sentry, DataDog, CloudWatch, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external logging service
    // Example: await sendToLoggingService(logEntry);
  }
}

/**
 * Get audit logs (admin only)
 */
export function getAuditLogs(filters?: {
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): AuditLogEntry[] {
  let logs = [...auditLogs];
  
  // Apply filters
  if (filters?.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  
  if (filters?.startDate) {
    logs = logs.filter(log => log.timestamp >= filters.startDate!);
  }
  
  if (filters?.endDate) {
    logs = logs.filter(log => log.timestamp <= filters.endDate!);
  }
  
  // Sort by most recent first
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Limit results
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }
  
  return logs;
}

/**
 * Clear old logs (for maintenance)
 */
export function clearOldLogs(olderThan: Date): number {
  const initialLength = auditLogs.length;
  const filtered = auditLogs.filter(log => log.timestamp >= olderThan);
  auditLogs.length = 0;
  auditLogs.push(...filtered);
  return initialLength - auditLogs.length;
}

