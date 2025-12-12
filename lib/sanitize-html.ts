// HTML sanitization utility for blog content
// This provides XSS protection for user-generated content
// Note: For production, consider using DOMPurify or similar library

/**
 * Basic HTML sanitization to prevent XSS attacks
 * Strips dangerous tags and attributes while preserving safe formatting
 * 
 * SECURITY NOTE: This is used for blog content that is stored in the codebase.
 * For user-generated content, implement proper server-side sanitization with a library like DOMPurify.
 */
export function sanitizeHtml(dirty: string): string {
  // For static blog content stored in the codebase, we trust the content
  // but still apply basic sanitization as a defense-in-depth measure
  
  // Remove script tags and their content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous event handlers
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  clean = clean.replace(/javascript:/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    clean = clean.replace(regex, '');
    // Also remove self-closing versions
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  });
  
  return clean;
}

/**
 * Sanitizes search queries and text input to prevent injection attacks
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/[^\w\s\-.,!?'"]/g, '') // Allow only safe characters
    .trim()
    .slice(0, 500); // Limit length to prevent DoS
}

/**
 * Validates and sanitizes URLs to prevent open redirect vulnerabilities
 */
export function sanitizeUrl(url: string): string {
  // Only allow specific protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'sms:'];
  
  try {
    const urlObj = new URL(url, 'https://www.filtersfast.com');
    if (allowedProtocols.includes(urlObj.protocol)) {
      return urlObj.toString();
    }
  } catch {
    // Invalid URL
  }
  
  // Return safe default
  return '#';
}

