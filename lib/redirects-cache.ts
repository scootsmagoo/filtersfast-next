/**
 * In-memory redirect cache for Edge Runtime
 * This file provides a lightweight cache that can be used in middleware
 */

import type { Redirect } from './db/redirects';

// This will be populated by an API route or server component
let redirectCache: Redirect[] = [];
let lastUpdated = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Set the redirect cache (called from API route or server component)
 */
export function setRedirectCache(redirects: Redirect[]) {
  redirectCache = redirects;
  lastUpdated = Date.now();
}

/**
 * Get all cached redirects
 */
export function getCachedRedirects(): Redirect[] {
  return redirectCache;
}

/**
 * Check if cache needs refresh
 */
export function shouldRefreshCache(): boolean {
  return Date.now() - lastUpdated > CACHE_TTL;
}

/**
 * Find matching redirect from cache (Edge Runtime compatible)
 */
export function findCachedRedirect(requestPath: string): Redirect | null {
  // First try exact matches (non-regex)
  for (const redirect of redirectCache) {
    if (!redirect.is_regex && redirect.is_active && redirect.source_path === requestPath) {
      return redirect;
    }
  }
  
  // Then try regex matches
  for (const redirect of redirectCache) {
    if (redirect.is_regex && redirect.is_active) {
      try {
        const regex = new RegExp(redirect.source_path);
        if (regex.test(requestPath)) {
          return redirect;
        }
      } catch (e) {
        // Invalid regex, skip
        console.error(`Invalid regex pattern: ${redirect.source_path}`, e);
      }
    }
  }
  
  return null;
}



