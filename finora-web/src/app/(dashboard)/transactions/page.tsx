import { createClient } from '@/lib/supabase/server'
import { TransactionsClient } from './TransactionsClient'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { rewritePeopleTransactionsToTransfers } from '@/utils/transactions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transactions' }

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [accountsRes, categoriesRes, transactionsRes, peopleBalancesRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*),
        from_account:accounts!transactions_from_account_id_fkey(*),
        to_account:accounts!transactions_to_account_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('people_balances')
      .select('subtype, amount, transaction_date, account_id, note')
      .eq('user_id', user.id)
      .in('subtype', ['borrow', 'lend', 'repay', 'collect'])
  ])

  // Dynamically rewrite the type of people-related transactions to 'transfer'
  // so they are not incorrectly categorized as income/expense in the UI filters
  const transactions = rewritePeopleTransactionsToTransfers(
    transactionsRes.data ?? [],
    peopleBalancesRes.data ?? []
  )

  return (
    <TransactionsClient
      transactions={transactions as never}
      accounts={accountsRes.data ?? []}
      categories={[...DEFAULT_CATEGORIES, ...(categoriesRes.data || [])]}
    />
  )
}
