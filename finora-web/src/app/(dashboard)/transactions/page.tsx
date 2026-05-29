import { createClient } from '@/lib/supabase/server'
import { TransactionsClient } from './TransactionsClient'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transactions' }

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
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
  ])

  return (
    <TransactionsClient
      transactions={(transactionsRes.data ?? []) as never}
      accounts={accountsRes.data ?? []}
      categories={categoriesRes.data && categoriesRes.data.length > 0 ? categoriesRes.data : DEFAULT_CATEGORIES}
    />
  )
}
