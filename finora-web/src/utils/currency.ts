/**
 * Format a number as currency.
 * @param amount - Numeric amount
 * @param currency - ISO 4217 currency code (default: USD)
 * @param locale - Locale string (default: en-US)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number with sign for transactions (+ for income, - for expense)
 */
export function formatTransactionAmount(
  amount: number,
  type: 'income' | 'expense' | 'transfer',
  currency: string = 'USD'
): string {
  const formatted = formatCurrency(Math.abs(amount), currency)
  if (type === 'income') return `+${formatted}`
  if (type === 'expense') return `-${formatted}`
  return formatted
}

/**
 * Get CSS class for transaction amount color
 */
export function getAmountColor(type: 'income' | 'expense' | 'transfer'): string {
  switch (type) {
    case 'income':
      return 'text-emerald-400'
    case 'expense':
      return 'text-red-400'
    case 'transfer':
      return 'text-blue-400'
    default:
      return 'text-foreground'
  }
}
