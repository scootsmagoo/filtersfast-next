/**
 * Product Discounts Utility Functions
 */

/**
 * Format date string from YYYYMMDD to readable format
 */
export function formatDateString(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return `${month}/${day}/${year}`
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return ''
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return `${year}-${month}-${day}`
}

/**
 * Format date from input field (YYYY-MM-DD) to YYYYMMDD
 */
export function formatDateFromInput(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Get target type label
 */
export function getTargetTypeLabel(targetType: string): string {
  switch (targetType) {
    case 'global':
      return 'Global'
    case 'product':
      return 'Product'
    case 'category':
      return 'Category'
    case 'product_type':
      return 'Product Type'
    default:
      return targetType
  }
}

/**
 * Get product type label
 */
export function getProductTypeLabel(productType: string | null | undefined): string {
  if (!productType) return ''
  switch (productType) {
    case 'fridge':
      return 'Refrigerator Filters'
    case 'water':
      return 'Water Filters'
    case 'air':
      return 'Air Filters'
    case 'humidifier':
      return 'Humidifier Filters'
    case 'pool':
      return 'Pool Filters'
    default:
      return productType
  }
}

