/**
 * Order Discounts Utility Functions
 * Client-safe utility functions (no database imports)
 */

/**
 * Format date string for display (MM/DD/YYYY)
 * Converts YYYYMMDD format to MM/DD/YYYY
 */
export function formatDateString(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return `${month}/${day}/${year}`
}

/**
 * Convert YYYYMMDD string to Date object
 */
export function dateStringToDate(dateStr: string): Date {
  if (dateStr.length !== 8) {
    throw new Error('Invalid date format. Expected YYYYMMDD')
  }
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

/**
 * Convert Date to YYYYMMDD string
 */
export function dateToDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr: string): string {
  if (dateStr.length !== 8) return ''
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return `${year}-${month}-${day}`
}

/**
 * Convert HTML date input (YYYY-MM-DD) to YYYYMMDD
 */
export function formatDateFromInput(dateInput: string): string {
  return dateInput.replace(/-/g, '')
}

