/**
 * Lightweight CSV utilities for admin tooling
 *
 * Supports RFC4180-style parsing/stringifying with basic quote handling.
 * Designed for moderate datasets (≤10k rows) used in admin exports/imports.
 */

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

/**
 * Parse a CSV string into headers + row objects.
 *
 * @param input Raw CSV contents (UTF-8 string)
 * @param options Optional configuration
 */
export function parseCsv(
  input: string,
  options?: {
    trimHeaders?: boolean
    skipEmptyRows?: boolean
    maxRows?: number
  }
): ParsedCsv {
  const config = {
    trimHeaders: true,
    skipEmptyRows: true,
    maxRows: 10000,
    ...options
  }

  const lines = normalizeNewlines(input).split('\n')
  if (lines.length === 0 || !lines[0].trim()) {
    throw new Error('CSV must include a header row')
  }

  const headers = splitCsvLine(lines[0]).map((header) =>
    config.trimHeaders ? header.trim() : header
  )

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]
    if (!rawLine && config.skipEmptyRows) continue

    const values = splitCsvLine(rawLine)
    if (values.length === 1 && values[0] === '' && config.skipEmptyRows) continue

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    rows.push(row)

    if (rows.length > config.maxRows) {
      throw new Error(`CSV exceeds the maximum supported rows (${config.maxRows})`)
    }
  }

  return { headers, rows }
}

/**
 * Convert data rows to CSV string. Headers are auto-discovered unless provided.
 */
export function stringifyCsv(
  rows: Array<Record<string, any>>,
  options?: {
    headers?: string[]
    includeHeader?: boolean
  }
): string {
  if (rows.length === 0) {
    return options?.headers ? options.headers.join(',') + '\n' : ''
  }

  const includeHeader = options?.includeHeader !== false
  const headers =
    options?.headers && options.headers.length > 0
      ? options.headers
      : Array.from(
          rows.reduce<Set<string>>((set, row) => {
            Object.keys(row).forEach((key) => set.add(key))
            return set
          }, new Set<string>())
        )

  const output: string[] = []

  if (includeHeader) {
    output.push(headers.map(escapeCsvValue).join(','))
  }

  rows.forEach((row) => {
    const values = headers.map((header) => escapeCsvValue(row[header]))
    output.push(values.join(','))
  })

  return output.join('\n')
}

/**
 * Utility: split a CSV line respecting quoted values.
 */
function splitCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

/**
 * Utility: escape CSV value with quotes when necessary.
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue === '') return ''

  const needsQuoting = /[",\r\n]/.test(stringValue)
  const escaped = stringValue.replace(/"/g, '""')
  return needsQuoting ? `"${escaped}"` : escaped
}

/**
 * Normalize newlines to \n for consistent parsing.
 */
function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

