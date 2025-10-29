/**
 * ID.me OAuth Utilities
 * 
 * Functions for handling ID.me OAuth 2.0 flow
 */

import type { IdMeTokenResponse, IdMeUserInfo } from './types/idme';

// ID.me Configuration
const IDME_BASE_URL = process.env.IDME_BASE_URL || 'https://api.id.me';
const IDME_OAUTH_URL = process.env.IDME_OAUTH_URL || 'https://groups.id.me';
const IDME_CLIENT_ID = process.env.IDME_CLIENT_ID;
const IDME_CLIENT_SECRET = process.env.IDME_CLIENT_SECRET;
const IDME_REDIRECT_URI = process.env.IDME_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/idme/callback`;

/**
 * Check if ID.me is configured
 */
export function isIdMeConfigured(): boolean {
  return !!(IDME_CLIENT_ID && IDME_CLIENT_SECRET);
}

/**
 * Get ID.me configuration or throw error
 */
function getIdMeConfig() {
  if (!IDME_CLIENT_ID || !IDME_CLIENT_SECRET) {
    throw new Error('ID.me is not configured. Please set IDME_CLIENT_ID and IDME_CLIENT_SECRET environment variables.');
  }
  return {
    clientId: IDME_CLIENT_ID,
    clientSecret: IDME_CLIENT_SECRET,
    redirectUri: IDME_REDIRECT_URI,
  };
}

/**
 * Generate authorization URL for ID.me OAuth flow
 */
export function getAuthorizationUrl(state?: string, scopes: string[] = ['military', 'responder']): string {
  const config = getIdMeConfig();
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
  });

  if (state) {
    params.append('state', state);
  }

  return `${IDME_OAUTH_URL}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<IdMeTokenResponse> {
  const config = getIdMeConfig();

  const response = await fetch(`${IDME_OAUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return await response.json();
}

/**
 * Get user information from ID.me
 */
export async function getUserInfo(accessToken: string): Promise<IdMeUserInfo> {
  const response = await fetch(`${IDME_BASE_URL}/api/public/v3/attributes.json`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  const data = await response.json();
  
  // Transform ID.me response to our format
  return {
    sub: data.uuid || data.sub,
    email: data.email,
    fname: data.fname,
    lname: data.lname,
    verified: data.verified || false,
    group: data.group || [],
  };
}

/**
 * Verify user and get their info in one call
 */
export async function verifyUser(code: string): Promise<IdMeUserInfo> {
  const tokenResponse = await exchangeCodeForToken(code);
  const userInfo = await getUserInfo(tokenResponse.access_token);
  return userInfo;
}

/**
 * Determine verification type from user groups
 */
export function getVerificationType(groups: string[]): string | null {
  // Priority order: employee > military > responder > student > teacher > nurse
  const priorityMap = {
    'employee': 1,
    'military': 2,
    'responder': 3,
    'student': 4,
    'teacher': 5,
    'nurse': 6,
  };

  const validGroups = groups.filter(g => g in priorityMap);
  if (validGroups.length === 0) return null;

  // Return highest priority group
  return validGroups.sort((a, b) => 
    priorityMap[a as keyof typeof priorityMap] - priorityMap[b as keyof typeof priorityMap]
  )[0];
}

/**
 * Generate a secure random state parameter
 */
export function generateState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate expiration date (1 year from now by default)
 */
export function calculateExpirationDate(months: number = 12): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

