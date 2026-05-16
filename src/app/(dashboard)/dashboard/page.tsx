import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/utils/currency'
import { getCurrentMonthRange } from '@/utils/dates'
import { AccountCard } from '@/components/accounts/AccountCard'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Plus } from 'lucide-react'
import Link from 'next/link'
import type { AccountWithBalance, TransactionWithDetails } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

/**
 * Computes account balance from transactions.
 * Income adds to to_account, expense subtracts from from_account,
 * transfer moves between accounts.
 */
async function getAccountBalances(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<AccountWithBalance[]> {
  // Fetch all accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (!accounts) return []

  // Fetch all transactions for balance calculation
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, from_account_id, to_account_id')
    .eq('user_id', userId)

  // Calculate balance for each account
  const balanceMap: Record<string, number> = {}

  for (const acc of accounts) {
    balanceMap[acc.id] = 0
  }

  for (const tx of transactions ?? []) {
    const amount = parseFloat(String(tx.amount))
    if (tx.type === 'income' && tx.to_account_id && tx.to_account_id in balanceMap) {
      balanceMap[tx.to_account_id] += amount
    } else if (tx.type === 'expense' && tx.from_account_id && tx.from_account_id in balanceMap) {
      balanceMap[tx.from_account_id] -= amount
    } else if (tx.type === 'transfer') {
      if (tx.from_account_id && tx.from_account_id in balanceMap) {
        balanceMap[tx.from_account_id] -= amount
      }
      if (tx.to_account_id && tx.to_account_id in balanceMap) {
        balanceMap[tx.to_account_id] += amount
      }
    }
  }

  return accounts.map((acc) => ({ ...acc, balance: balanceMap[acc.id] ?? 0 }))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { start, end } = getCurrentMonthRange()

  // Parallel data fetching for performance
  const [accountsWithBalance, monthlyStatsRaw, recentTransactions, categoryExpenses] = await Promise.all([
    getAccountBalances(supabase, user.id),

    // Monthly income and expenses
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .in('type', ['income', 'expense'])
      .gte('transaction_date', start)
      .lte('transaction_date', end),

    // Recent transactions with joins
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
      .limit(8),

    // Category breakdown for current month
    supabase
      .from('transactions')
      .select(`
        amount,
        category:categories(id, name, color, icon, type)
      `)
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .not('category_id', 'is', null),
  ])

  // Calculate monthly stats
  let monthlyIncome = 0
  let monthlyExpenses = 0
  for (const tx of monthlyStatsRaw.data ?? []) {
    const amount = parseFloat(String(tx.amount))
    if (tx.type === 'income') monthlyIncome += amount
    else if (tx.type === 'expense') monthlyExpenses += amount
  }

  // Calculate total balance (sum of all accounts)
  const totalBalance = accountsWithBalance.reduce((sum, acc) => sum + acc.balance, 0)
  const netSavings = monthlyIncome - monthlyExpenses

  // Process category expenses for chart
  const catMap: Record<string, { name: string; color: string; icon: string; amount: number }> = {}
  for (const tx of categoryExpenses.data ?? []) {
    const cat = (Array.isArray(tx.category) ? tx.category[0] : tx.category) as { id: string; name: string; color: string; icon: string } | null
    if (!cat) continue
    if (!catMap[cat.name]) {
      catMap[cat.name] = { name: cat.name, color: cat.color, icon: cat.icon, amount: 0 }
    }
    catMap[cat.name].amount += parseFloat(String(tx.amount))
  }
  const categoryBreakdown = Object.values(catMap).sort((a, b) => b.amount - a.amount)

  const statCards = [
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalance),
      icon: DollarSign,
      gradient: 'from-violet-500/20 to-violet-500/5',
      border: 'border-violet-500/20',
      textColor: 'text-violet-400',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(monthlyIncome),
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(monthlyExpenses),
      icon: TrendingDown,
      gradient: 'from-red-500/20 to-red-500/5',
      border: 'border-red-500/20',
      textColor: 'text-red-400',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(Math.abs(netSavings)),
      icon: PiggyBank,
      gradient: netSavings >= 0 ? 'from-blue-500/20 to-blue-500/5' : 'from-orange-500/20 to-orange-500/5',
      border: netSavings >= 0 ? 'border-blue-500/20' : 'border-orange-500/20',
      textColor: netSavings >= 0 ? 'text-blue-400' : 'text-orange-400',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user.user_metadata?.full_name?.split(' ')[0] ?? 'there'}!
            Here&apos;s your financial overview.
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`rounded-2xl border bg-gradient-to-br p-5 ${card.gradient} ${card.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`p-2 rounded-xl bg-white/10 ${card.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts and Category Breakdown */}
      <DashboardCharts
        categoryBreakdown={categoryBreakdown}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
      />

      {/* Accounts and Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Account Balances */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Accounts</h2>
            <Link href="/accounts" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {accountsWithBalance.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
              <p className="text-muted-foreground text-sm">No accounts yet</p>
              <Link href="/accounts" className="text-primary text-sm hover:underline mt-2 inline-block">
                Create your first account →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accountsWithBalance.slice(0, 4).map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
            {!recentTransactions.data?.length ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {(recentTransactions.data as TransactionWithDetails[]).map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
