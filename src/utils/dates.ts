import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, pattern: string = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return dateString
  }
}

/**
 * Get the start and end of the current month as ISO strings
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  }
}

/**
 * Format a date for use in HTML date inputs (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return formatDateForInput(new Date())
}
