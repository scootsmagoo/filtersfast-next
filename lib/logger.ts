/**
 * Centralized Logging System
 * 
 * Provides structured logging with support for production monitoring.
 * Ready for integration with Sentry, LogRocket, or similar services.
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Payment failed', { orderId: 456, error });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext) {
    const entry = this.createLogEntry('info', message, context);
    
    if (this.isDevelopment) {
      console.log(`ℹ️  [INFO] ${message}`, context || '');
    }
    
    if (this.isProduction) {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    const entry = this.createLogEntry('warn', message, context);
    
    console.warn(`⚠️  [WARN] ${message}`, context || '');
    
    if (this.isProduction) {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, context?: LogContext) {
    const entry = this.createLogEntry('error', message, context);
    
    console.error(`❌ [ERROR] ${message}`, context || '');
    
    if (this.isProduction) {
      this.sendToMonitoring(entry);
      // In production, also send to error tracking service
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Log security-related events
   */
  security(message: string, context?: LogContext) {
    const entry = this.createLogEntry('security', message, context);
    
    console.warn(`🚨 [SECURITY] ${message}`, context || '');
    
    // Always log security events, even in development
    this.sendToSecurityLog(entry);
    
    if (this.isProduction) {
      this.sendToMonitoring(entry);
      // Alert on security events
      this.sendSecurityAlert(entry);
    }
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  /**
   * Send to monitoring service (e.g., Sentry, LogRocket)
   */
  private sendToMonitoring(entry: LogEntry) {
    // TODO: Integrate with Sentry
    // Example:
    // Sentry.captureMessage(entry.message, {
    //   level: entry.level as SeverityLevel,
    //   extra: entry.context,
    // });
    
    // For now, structured console logging
    if (this.isProduction) {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Send to error tracking service
   */
  private sendToErrorTracking(entry: LogEntry) {
    // TODO: Integrate with Sentry
    // Example:
    // Sentry.captureException(entry.context?.error || new Error(entry.message), {
    //   extra: entry.context,
    // });
  }

  /**
   * Log security events to dedicated security log
   */
  private sendToSecurityLog(entry: LogEntry) {
    // TODO: Send to dedicated security monitoring
    // Example: Dedicated security SIEM, PagerDuty, etc.
    
    // For now, clearly marked console output
    console.error('🚨 SECURITY EVENT:', JSON.stringify(entry));
  }

  /**
   * Send security alert
   */
  private sendSecurityAlert(entry: LogEntry) {
    // TODO: Send immediate alerts for security events
    // Example: PagerDuty, Slack webhook, email alert
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Usage Examples:
 * 
 * // Debug (development only)
 * logger.debug('Loading user data', { userId: 123 });
 * 
 * // Info
 * logger.info('User logged in', { email: 'user@example.com' });
 * 
 * // Warning
 * logger.warn('Rate limit approaching', { ip: '1.2.3.4', attempts: 4 });
 * 
 * // Error
 * logger.error('Payment failed', { orderId: 789, error: err.message });
 * 
 * // Security
 * logger.security('CSRF attempt detected', { origin: 'evil.com', ip: '1.2.3.4' });
 */

