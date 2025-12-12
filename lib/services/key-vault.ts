'use server'

/**
 * Azure Key Vault Monitoring Service
 *
 * Provides helpers to query the legacy KVM API that fronts Azure Key Vault.
 * Used by admin utilities for secret health and expiry monitoring.
 */

import { logger } from '@/lib/logger'

const DEFAULT_API_BASE_URL = 'https://www.filtersfast.com/kvmapi/api'
const DEFAULT_SECRET_SUFFIXES = [
  'CyberSourceUSKey',
  'CyberSourceINTKey',
  'PayPalSecret',
  'SiteConfigEncryptionKey',
]

export interface KeyVaultStatus {
  raw: string
  isOperational: boolean
}

export interface KeyVaultSecretMetadata {
  name: string
  objectType: 'Secret'
  createdOn: string | null
  expiresOn: string | null
  daysUntilExpiry: number | null
  isExpired: boolean
  isExpiringSoon: boolean
  source: 'default' | 'custom'
}

export interface KeyVaultMonitorResult {
  status: KeyVaultStatus
  environmentLabel: string
  secrets: KeyVaultSecretMetadata[]
  checkedAt: string
}

function getConfig() {
  const baseUrl = process.env.KEY_VAULT_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
  const bearer = process.env.KEY_VAULT_API_BEARER?.trim()
  const explicitSecretNames = process.env.KEY_VAULT_SECRET_NAMES
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const suffixes = process.env.KEY_VAULT_SECRET_SUFFIXES
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const environmentLabel =
    process.env.KEY_VAULT_ENVIRONMENT?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'Production' : 'Test')

  let normalizedBaseUrl: string

  try {
    const parsedUrl = new URL(baseUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Key Vault base URL must use HTTP or HTTPS')
    }

    const isLocalhost =
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1' ||
      parsedUrl.hostname === '[::1]'

    if (parsedUrl.protocol === 'http:' && !isLocalhost) {
      throw new Error('Key Vault base URL must use HTTPS in non-local environments')
    }

    // Normalise by removing trailing slash from pathname while preserving query/hash if provided
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '')
    normalizedBaseUrl = parsedUrl.toString()
  } catch (error: any) {
    throw new Error(`Invalid KEY_VAULT_API_BASE_URL: ${error.message}`)
  }

  if (!bearer) {
    throw new Error('KEY_VAULT_API_BEARER environment variable is not configured')
  }

  return {
    baseUrl: normalizedBaseUrl,
    bearer,
    explicitSecretNames,
    suffixes,
    environmentLabel,
  }
}

async function keyVaultFetch(path: string): Promise<any> {
  const config = getConfig()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const baseForUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`
    const requestUrl = new URL(normalizedPath, baseForUrl)

    const response = await fetch(requestUrl.toString(), {
      headers: {
        Authorization: config.bearer,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    const rawText = await response.text()

    if (!response.ok) {
      logger.error('Key Vault API request failed', {
        path,
        status: response.status,
        body: rawText,
      })
      throw new Error(`Key Vault API responded with status ${response.status}`)
    }

    try {
      return rawText ? JSON.parse(rawText) : null
    } catch {
      return rawText
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      logger.warn('Key Vault API request timed out', { path })
      throw new Error('Request to Key Vault API timed out')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function parseDate(value: any): string | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function calculateDaysUntilExpiry(expiresOn: string | null): number | null {
  if (!expiresOn) return null
  const expires = new Date(expiresOn).getTime()
  const now = Date.now()
  if (Number.isNaN(expires)) return null
  const diffMs = expires - now
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function determineSecretStatus(daysUntilExpiry: number | null) {
  if (daysUntilExpiry === null) {
    return {
      isExpired: false,
      isExpiringSoon: false,
    }
  }

  if (daysUntilExpiry < 0) {
    return {
      isExpired: true,
      isExpiringSoon: true,
    }
  }

  return {
    isExpired: false,
    isExpiringSoon: daysUntilExpiry <= 30,
  }
}

export async function fetchKeyVaultStatus(): Promise<KeyVaultStatus> {
  try {
    const data = await keyVaultFetch('/Check')
    const rawText = typeof data === 'string' ? data : JSON.stringify(data)
    const text = rawText.length > 512 ? `${rawText.slice(0, 512)}…` : rawText
    return {
      raw: text || 'Unknown',
      isOperational: typeof text === 'string' ? /operational/i.test(text) : false,
    }
  } catch (error: any) {
    logger.error('Failed to fetch Key Vault status', { error: error.message })
    return {
      raw: `Error: ${error.message}`,
      isOperational: false,
    }
  }
}

function buildSecretNames(config: ReturnType<typeof getConfig>): Array<{ name: string; source: 'default' | 'custom' }> {
  if (config.explicitSecretNames && config.explicitSecretNames.length > 0) {
    return config.explicitSecretNames.map((name) => ({ name, source: 'custom' as const }))
  }

  const suffixes = config.suffixes && config.suffixes.length > 0 ? config.suffixes : DEFAULT_SECRET_SUFFIXES
  return suffixes.map((suffix) => ({
    name: `${config.environmentLabel}${suffix}`,
    source: 'default' as const,
  }))
}

async function fetchSecretMetadata(
  name: string,
  source: 'default' | 'custom'
): Promise<KeyVaultSecretMetadata | null> {
  try {
    const payload = await keyVaultFetch(`/Secret?name=${encodeURIComponent(name)}`)
    if (!payload) {
      logger.warn('Empty response when fetching Key Vault secret metadata', { name })
      return null
    }

    const createdOn = parseDate(payload.CreatedOn ?? payload.createdOn ?? payload.properties?.createdOn)
    const expiresOn = parseDate(payload.ExpiresOn ?? payload.expiresOn ?? payload.properties?.expiresOn)
    const daysUntilExpiry = calculateDaysUntilExpiry(expiresOn)
    const { isExpired, isExpiringSoon } = determineSecretStatus(daysUntilExpiry)

    return {
      name,
      objectType: 'Secret',
      createdOn,
      expiresOn,
      daysUntilExpiry,
      isExpired,
      isExpiringSoon,
      source,
    }
  } catch (error: any) {
    logger.error('Failed to fetch Key Vault secret metadata', { name, error: error.message })
    return {
      name,
      objectType: 'Secret',
      createdOn: null,
      expiresOn: null,
      daysUntilExpiry: null,
      isExpired: false,
      isExpiringSoon: false,
      source,
    }
  }
}

export async function fetchKeyVaultMonitor(): Promise<KeyVaultMonitorResult> {
  const config = getConfig()
  const status = await fetchKeyVaultStatus()

  const secretNames = buildSecretNames(config)
  const secrets = (
    await Promise.all(secretNames.map(({ name, source }) => fetchSecretMetadata(name, source)))
  ).filter(Boolean) as KeyVaultSecretMetadata[]

  return {
    status,
    environmentLabel: config.environmentLabel,
    secrets,
    checkedAt: new Date().toISOString(),
  }
}


