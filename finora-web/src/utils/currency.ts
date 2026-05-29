/**
 * Format a number as currency.
 * @param amount - Numeric amount
 * @param currency - ISO 4217 currency code (default: USD)
 * @param locale - Locale string (default: en-US)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PKR',
  locale: string = 'en-PK'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number with sign for transactions (+ for income, - for expense)
 */
export function formatTransactionAmount(
  amount: number,
  type: 'income' | 'expense' | 'transfer' | 'opening_balance',
  currency: string = 'PKR'
): string {
  const formatted = formatCurrency(Math.abs(amount), currency)
  if (type === 'income' || type === 'opening_balance') return `+${formatted}`
  if (type === 'expense') return `-${formatted}`
  return formatted
}

/**
 * Get CSS class for transaction amount color
 */
export function getAmountColor(type: 'income' | 'expense' | 'transfer' | 'opening_balance'): string {
  switch (type) {
    case 'income':
      return 'text-emerald-400'
    case 'expense':
      return 'text-red-400'
    case 'transfer':
      return 'text-blue-400'
    case 'opening_balance':
      return 'text-purple-400'
    default:
      return 'text-foreground'
  }
}
