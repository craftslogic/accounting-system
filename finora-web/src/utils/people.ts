/**
 * People balance calculation utilities.
 * Pure functions — no server-side dependencies.
 * Can be imported by both server and client code.
 */

/**
 * Compute outstanding balance for a direction (payable or receivable).
 *
 * Outstanding Payable  = opening_payable + borrow - repay - writeoff(payable) ± adjustment
 * Outstanding Receivable = opening_receivable + lend - collect - writeoff(receivable) ± adjustment
 */
export function calculateOutstanding(
  rows: { type: string; subtype: string | null; amount: number }[],
  direction: 'payable' | 'receivable'
): number {
  let outstanding = 0

  for (const row of rows) {
    const amt = typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount
    if (direction === 'payable') {
      if (row.type === 'opening_payable') outstanding += amt
      else if (row.type === 'payable' && row.subtype === 'borrow') outstanding += amt
      else if (row.type === 'payable' && row.subtype === 'repay') outstanding -= amt
      else if (row.type === 'payable' && row.subtype === 'writeoff') outstanding -= amt
      else if (row.type === 'payable' && row.subtype === 'adjustment') outstanding += amt
    } else {
      if (row.type === 'opening_receivable') outstanding += amt
      else if (row.type === 'receivable' && row.subtype === 'lend') outstanding += amt
      else if (row.type === 'receivable' && row.subtype === 'collect') outstanding -= amt
      else if (row.type === 'receivable' && row.subtype === 'writeoff') outstanding -= amt
      else if (row.type === 'receivable' && row.subtype === 'adjustment') outstanding += amt
    }
  }

  return Math.max(0, outstanding)
}
