import type { TransactionWithDetails } from '@/types'

/**
 * Rewrites the type of transactions to 'transfer' if they match a people_balance
 * so they don't show up as 'income' or 'expense' in the UI.
 */
export function rewritePeopleTransactionsToTransfers(
  transactions: any[],
  peopleBalances: any[]
) {
  return transactions.map(tx => {
    if (tx.type !== 'income' && tx.type !== 'expense') return tx

    const matched = peopleBalances.find(pb => {
      const isPbInflow = pb.subtype === 'borrow' || pb.subtype === 'collect'
      const expectedType = isPbInflow ? 'income' : 'expense'
      if (tx.type !== expectedType) return false
      if (parseFloat(String(tx.amount)) !== parseFloat(String(pb.amount))) return false
      
      const txDate = String(tx.transaction_date).substring(0, 10)
      const pbDate = String(pb.transaction_date).substring(0, 10)
      if (txDate !== pbDate) return false

      const expectedAccount = pb.account_id
      const actualAccount = isPbInflow ? tx.to_account_id : tx.from_account_id
      if (expectedAccount !== actualAccount) return false

      const expectedNote = pb.note ?? `People: ${pb.subtype}`
      if (tx.note !== expectedNote) return false

      return true
    })

    if (matched) {
      return { ...tx, type: 'transfer' }
    }
    return tx
  })
}
