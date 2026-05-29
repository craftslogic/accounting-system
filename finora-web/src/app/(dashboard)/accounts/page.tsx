import { createClient } from '@/lib/supabase/server'
import { AccountsClient } from './AccountsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Accounts' }

/**
 * Computes account balances server-side from transactions.
 * No balance column stored — always derived from transaction history.
 */
async function getAccountsWithBalances(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, from_account_id, to_account_id')
    .eq('user_id', userId)

  const balanceMap: Record<string, number> = {}
  for (const acc of accounts ?? []) balanceMap[acc.id] = 0

  for (const tx of transactions ?? []) {
    const amount = parseFloat(String(tx.amount))
    if ((tx.type === 'income' || tx.type === 'opening_balance') && tx.to_account_id && tx.to_account_id in balanceMap) {
      balanceMap[tx.to_account_id] += amount
    } else if (tx.type === 'expense' && tx.from_account_id && tx.from_account_id in balanceMap) {
      balanceMap[tx.from_account_id] -= amount
    } else if (tx.type === 'transfer') {
      if (tx.from_account_id && tx.from_account_id in balanceMap) balanceMap[tx.from_account_id] -= amount
      if (tx.to_account_id && tx.to_account_id in balanceMap) balanceMap[tx.to_account_id] += amount
    }
  }

  return (accounts ?? []).map((acc) => ({ ...acc, balance: balanceMap[acc.id] ?? 0 }))
}

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const accounts = await getAccountsWithBalances(supabase, user.id)

  return <AccountsClient accounts={accounts} />
}
