'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Filter, Trash2, Edit, X } from 'lucide-react'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deleteTransactionAction } from '@/actions/transactions'
import { toast } from '@/hooks/use-toast'
import type { Account, Category, TransactionWithDetails, Transaction } from '@/types'

interface TransactionsClientProps {
  transactions: TransactionWithDetails[]
  accounts: Account[]
  categories: Category[]
}

export function TransactionsClient({
  transactions,
  accounts,
  categories,
}: TransactionsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter transactions client-side
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !search ||
        tx.note?.toLowerCase().includes(search.toLowerCase()) ||
        tx.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.from_account?.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.to_account?.name.toLowerCase().includes(search.toLowerCase())

      const matchType = typeFilter === 'all' || tx.type === typeFilter

      const matchAccount =
        accountFilter === 'all' ||
        tx.from_account_id === accountFilter ||
        tx.to_account_id === accountFilter

      const matchCategory =
        categoryFilter === 'all' || tx.category_id === categoryFilter

      return matchSearch && matchType && matchAccount && matchCategory
    })
  }, [transactions, search, typeFilter, accountFilter, categoryFilter])

  const hasFilters =
    search || typeFilter !== 'all' || accountFilter !== 'all' || categoryFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setAccountFilter('all')
    setCategoryFilter('all')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    const result = await deleteTransactionAction(id)
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Transaction deleted', variant: 'success' as never })
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} of {transactions.length} transactions
          </p>
        </div>
        <Button
          className="gradient-primary border-0 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-3 h-3 mr-1 opacity-50" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Transaction List */}
      <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {hasFilters
                ? 'Try adjusting your filters'
                : 'Add your first transaction to get started'}
            </p>
            {!hasFilters && (
              <Button
                className="gradient-primary border-0 text-white"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((tx) => (
              <div key={tx.id} className="border-b border-white/5 last:border-0">
                <TransactionRow
                  transaction={tx}
                  actions={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditTx(tx)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            accounts={accounts}
            categories={categories}
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <TransactionForm
              accounts={accounts}
              categories={categories}
              initialData={editTx}
              onSuccess={() => setEditTx(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
