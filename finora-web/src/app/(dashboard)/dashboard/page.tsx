import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/utils/currency'
import { getCurrentMonthRange } from '@/utils/dates'
import { AccountCard } from '@/components/accounts/AccountCard'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { FundsDashboardWidget } from '@/components/funds/FundsDashboardWidget'

import { TrendingUp, TrendingDown, Users, PiggyBank, Plus, ArrowLeftRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import type { AccountWithBalance, TransactionWithDetails } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

async function getAccountBalances(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<AccountWithBalance[]> {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (!accounts) return []

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, from_account_id, to_account_id')
    .eq('user_id', userId)

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

async function getPeopleData(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string) {
  const { data } = await supabase
    .from('people_balances')
    .select('id, type, amount, contact:contacts(name)')
    .eq('user_id', userId)
  
  let totalPayable = 0
  let totalReceivable = 0

  for (const bal of data ?? []) {
    const amount = parseFloat(String(bal.amount))
    if (bal.type === 'payable') totalPayable += amount
    else if (bal.type === 'receivable') totalReceivable += amount
  }

  return { 
    totalPayable, 
    totalReceivable, 
    balances: data?.slice(0, 3) || [] 
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { start, end } = getCurrentMonthRange()

  const [accountsWithBalance, monthlyStatsRaw, recentTransactions, peopleData, fundsData, budgetsData] = await Promise.all([
    getAccountBalances(supabase, user.id),

    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .in('type', ['income', 'expense'])
      .gte('transaction_date', start)
      .lte('transaction_date', end),

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

    getPeopleData(supabase, user.id),

    supabase
      .from('funds')
      .select('current_amount')
      .eq('user_id', user.id)
      .eq('is_archived', false),

    supabase
      .from('budgets')
      .select('amount')
      .eq('user_id', user.id)
      .eq('period', 'monthly')
  ])

  // Monthly stats
  let monthlyIncome = 0
  let monthlyExpenses = 0
  for (const tx of monthlyStatsRaw.data ?? []) {
    const amount = parseFloat(String(tx.amount))
    if (tx.type === 'income') monthlyIncome += amount
    else if (tx.type === 'expense') monthlyExpenses += amount
  }
  const netSavings = monthlyIncome - monthlyExpenses

  // Budgets
  const totalMonthlyLimit = (budgetsData.data ?? []).reduce((sum, b) => sum + parseFloat(String(b.amount)), 0)
  const budgetUsedPct = totalMonthlyLimit > 0 ? Math.min(100, Math.round((monthlyExpenses / totalMonthlyLimit) * 100)) : 0

  // Balances
  const totalBalance = accountsWithBalance.reduce((sum, acc) => sum + acc.balance, 0)
  const totalReservedInFunds = (fundsData.data ?? []).reduce((sum, f) => sum + parseFloat(String(f.current_amount)), 0)
  const { totalPayable, totalReceivable } = peopleData
  
  const actualBalance = totalBalance - totalReservedInFunds - totalPayable + totalReceivable

  const statCards = [
    {
      label: 'Income',
      value: formatCurrency(monthlyIncome),
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Expenses',
      value: formatCurrency(monthlyExpenses),
      icon: TrendingDown,
      gradient: 'from-orange-500/20 to-orange-500/5',
      border: 'border-orange-500/20',
      textColor: 'text-orange-400',
    },
    {
      label: 'Savings',
      value: formatCurrency(netSavings),
      icon: PiggyBank,
      gradient: netSavings >= 0 ? 'from-blue-500/20 to-blue-500/5' : 'from-gray-500/20 to-gray-500/5',
      border: netSavings >= 0 ? 'border-blue-500/20' : 'border-gray-500/20',
      textColor: netSavings >= 0 ? 'text-blue-400' : 'text-gray-400',
    },
    {
      label: 'Receivables',
      value: formatCurrency(totalReceivable),
      icon: Users,
      gradient: 'from-violet-500/20 to-violet-500/5',
      border: 'border-violet-500/20',
      textColor: 'text-violet-400',
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
          </p>
        </div>
      </div>

      {/* 1. Big Available Balance Card */}
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600 to-blue-900 p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative z-10">
          <p className="text-blue-100 font-medium mb-2">Available Balance</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
            {formatCurrency(actualBalance)}
          </h2>
          <p className="text-sm text-blue-200/80">
            {formatCurrency(totalBalance)} Total - {formatCurrency(totalReservedInFunds)} Reserved - {formatCurrency(totalPayable)} Payables
          </p>
        </div>
      </div>

      {/* 2. Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`rounded-2xl border bg-gradient-to-br p-5 ${card.gradient} ${card.border}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`p-2 rounded-xl bg-white/10 ${card.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. Budget Progress */}
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Monthly Budget</h3>
            <Link href="/budgets" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          {totalMonthlyLimit > 0 ? (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">{formatCurrency(monthlyExpenses)} of {formatCurrency(totalMonthlyLimit)}</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${budgetUsedPct >= 100 ? 'bg-red-500' : budgetUsedPct > 80 ? 'bg-orange-500' : 'bg-primary'}`} 
                  style={{ width: `${budgetUsedPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right mt-2">{budgetUsedPct}% Used</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-4">No monthly budget set</p>
              <Link href="/budgets" className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Set Budget
              </Link>
            </div>
          )}
        </div>

        {/* 6. Quick Actions */}
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h3 className="font-semibold text-lg mb-6">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/transactions" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">Expense</span>
            </Link>
            <Link href="/transactions" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">Income</span>
            </Link>
            <Link href="/transactions" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">Transfer</span>
            </Link>
            <Link href="/funds" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">Allocate</span>
            </Link>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Funds Snapshot */}
        <FundsDashboardWidget />

        {/* 5. People Snapshot */}
        <div className="rounded-2xl border border-white/10 bg-card p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">People Snapshot</h2>
              <p className="text-sm text-muted-foreground mt-1">Money shared with others</p>
            </div>
            <Link href="/people" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View all
            </Link>
          </div>
          <div className="flex-1 space-y-3">
            {peopleData.balances.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-white/10 bg-white/5">
                <Users className="w-8 h-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground">No people tracking</p>
                <p className="text-xs text-muted-foreground mt-1">Track money you owe or are owed</p>
              </div>
            ) : (
              peopleData.balances.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{b.contact?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{b.contact?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {b.type === 'payable' ? 'Money Held For Them' : 'Owes You'}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${b.type === 'payable' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(b.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Accounts & 7. Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
