/**
 * Admin Direct Email configuration helpers
 * Mirrors legacy Manager/email.asp defaults while allowing modern overrides
 */

import { sanitizeEmail } from '@/lib/sanitize'
import { validateEmail } from '@/lib/security'

export type DirectEmailProvider = 'sendgrid' | 'console'

export interface DirectEmailSenderOption {
  address: string
  label: string
}

export interface DirectEmailConfig {
  companyName: string
  provider: DirectEmailProvider
  emailEnabled: boolean
  allowedFromAddresses: DirectEmailSenderOption[]
  defaultFromAddress: string
  subjectMaxLength: number
  bodyMaxLength: number
  defaultSendCopy: boolean
  prefillTemplate: string
}

export const DIRECT_EMAIL_PERMISSION = 'DirectEmail'
export const DIRECT_EMAIL_SUBJECT_MAX_LENGTH = 200
export const DIRECT_EMAIL_BODY_MAX_LENGTH = 10000

const DEFAULT_SENDER_OPTIONS: DirectEmailSenderOption[] = [
  { address: 'sales@filtersfast.com', label: 'FiltersFast Sales' },
  { address: 'support@filtersfast.com', label: 'FiltersFast Support' },
  { address: 'admin@filtersfast.com', label: 'FiltersFast Admin' },
]

function determineProvider(): DirectEmailProvider {
  const override = process.env.EMAIL_PROVIDER?.toLowerCase()

  if (override === 'sendgrid') return 'sendgrid'
  if (override === 'console') return 'console'

  return process.env.SENDGRID_API_KEY ? 'sendgrid' : 'console'
}

function parseAddressEntry(entry: string): DirectEmailSenderOption | null {
  const trimmed = entry.trim()
  if (!trimmed) return null

  const angleMatch = trimmed.match(/^(.*)<([^>]+)>$/)

  let label = ''
  let email = trimmed

  if (angleMatch) {
    label = angleMatch[1].trim().replace(/^["']|["']$/g, '')
    email = angleMatch[2].trim()
  }

  const normalized = sanitizeEmail(email)
  if (!validateEmail(normalized)) {
    return null
  }

  return {
    address: normalized,
    label: label || normalized,
  }
}

function collectConfiguredSenders(): DirectEmailSenderOption[] {
  const sources: DirectEmailSenderOption[] = []

  const envList = process.env.DIRECT_EMAIL_FROM_ADDRESSES
  if (envList) {
    envList
      .split(',')
      .map((value) => parseAddressEntry(value))
      .filter((option): option is DirectEmailSenderOption => Boolean(option))
      .forEach((option) => sources.push(option))
  }

  const envDefault = process.env.DIRECT_EMAIL_DEFAULT_FROM
  if (envDefault) {
    const option = parseAddressEntry(envDefault)
    if (option) {
      sources.push(option)
    }
  }

  const sendgridDefault = process.env.SENDGRID_FROM_EMAIL
  if (sendgridDefault) {
    const option = parseAddressEntry(sendgridDefault)
    if (option) {
      const hasLabel = option.label === option.address
      sources.push({
        address: option.address,
        label: hasLabel ? 'FiltersFast Transactional' : option.label,
      })
    }
  }

  return sources
}

function dedupeSenders(options: DirectEmailSenderOption[]): DirectEmailSenderOption[] {
  const seen = new Map<string, DirectEmailSenderOption>()

  options.forEach((option) => {
    const key = option.address.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, option)
    }
  })

  return Array.from(seen.values())
}

/**
 * Resolve configuration for admin direct email composer
 */
export function getDirectEmailConfig(): DirectEmailConfig {
  const provider = determineProvider()
  const companyName = process.env.COMPANY_NAME?.trim() || 'FiltersFast'

  const configuredSenders = collectConfiguredSenders()
  const allowedFromAddresses = dedupeSenders([
    ...configuredSenders,
    ...DEFAULT_SENDER_OPTIONS,
  ])

  const defaultFromEnv = process.env.DIRECT_EMAIL_DEFAULT_FROM
  const defaultFrom =
    (defaultFromEnv && parseAddressEntry(defaultFromEnv)?.address) ||
    allowedFromAddresses[0]?.address ||
    'support@filtersfast.com'

  return {
    companyName,
    provider,
    emailEnabled: provider === 'sendgrid',
    allowedFromAddresses,
    defaultFromAddress: defaultFrom,
    subjectMaxLength: DIRECT_EMAIL_SUBJECT_MAX_LENGTH,
    bodyMaxLength: DIRECT_EMAIL_BODY_MAX_LENGTH,
    defaultSendCopy: true,
    prefillTemplate: [
      'TO : {{recipientName}}',
      '',
      'RE : {{subject}}',
      '',
    ].join('\n'),
  }
}

/**
 * Validate that the requested sender is in the configured allowlist
 */
export function isSenderAllowed(address: string, config?: DirectEmailConfig): boolean {
  if (!address) return false
  const normalized = sanitizeEmail(address)
  if (!validateEmail(normalized)) return false

  const resolvedConfig = config ?? getDirectEmailConfig()
  return resolvedConfig.allowedFromAddresses.some(
    (option) => option.address.toLowerCase() === normalized.toLowerCase(),
  )
}


