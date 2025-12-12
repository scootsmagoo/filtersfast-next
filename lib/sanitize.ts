/**
 * Input Sanitization Utility
 * 
 * Prevents XSS attacks by sanitizing user input
 */

/**
 * Sanitize text input to prevent XSS
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .slice(0, 1000); // Max length
}

/**
 * Alias for sanitizeText (for backward compatibility)
 */
export const sanitizeInput = sanitizeText;

/**
 * Default export alias
 */
export const sanitize = sanitizeText;

/**
 * Sanitize HTML - strips all tags
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 1000);
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .slice(0, 254); // RFC 5321
}

/**
 * Sanitize phone number - keep only digits and common chars
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  return phone
    .replace(/[^0-9+\-() ]/g, '')
    .trim()
    .slice(0, 20);
}

/**
 * Sanitize URL - validate it's a safe URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return url.slice(0, 2048);
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize number
 */
export function sanitizeNumber(value: any, min?: number, max?: number): number | null {
  const num = parseFloat(value);
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  
  return num;
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

