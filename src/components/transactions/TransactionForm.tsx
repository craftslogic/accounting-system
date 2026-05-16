'use client'

import { useActionState, useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { createTransactionAction, updateTransactionAction } from '@/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { today } from '@/utils/dates'
import type { Account, Category, Transaction, TransactionType, ActionResult } from '@/types'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  initialData?: Transaction
  onSuccess?: () => void
}

const initialState: ActionResult<Transaction> = { success: false, error: '' }

/**
 * Reusable transaction form supporting all 3 types: income, expense, transfer.
 * Conditionally shows account/category selects based on type.
 */
export function TransactionForm({
  accounts,
  categories,
  initialData,
  onSuccess,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense')
  
  const action = initialData
    ? updateTransactionAction.bind(null, initialData.id)
    : createTransactionAction

  const [state, formAction, pending] = useActionState(
    action as (prevState: ActionResult<Transaction>, formData: FormData) => Promise<ActionResult<Transaction>>,
    initialState
  )

  useEffect(() => {
    if (state?.success) {
      toast({
        title: initialData ? 'Transaction updated' : 'Transaction created',
        variant: 'success' as never,
      })
      onSuccess?.()
    }
  }, [state?.success])

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const activeCategories = type === 'income' ? incomeCategories : expenseCategories
  const activeAccounts = accounts.filter((a) => !a.is_archived)

  return (
    <form action={formAction} className="space-y-5">
      {/* Error */}
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Type */}
      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all capitalize ${
                type === t
                  ? t === 'income'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : t === 'expense'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'border-input bg-background text-muted-foreground hover:bg-accent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          defaultValue={initialData?.amount}
          required
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="transaction_date">Date</Label>
        <Input
          id="transaction_date"
          name="transaction_date"
          type="date"
          defaultValue={
            initialData?.transaction_date
              ? initialData.transaction_date.substring(0, 10)
              : today()
          }
          required
        />
      </div>

      {/* From Account (expense, transfer) */}
      {(type === 'expense' || type === 'transfer') && (
        <div className="space-y-2">
          <Label htmlFor="from_account_id">
            {type === 'transfer' ? 'From Account' : 'Account'}
          </Label>
          <Select
            name="from_account_id"
            defaultValue={initialData?.from_account_id ?? undefined}
            required
          >
            <SelectTrigger id="from_account_id">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* To Account (income, transfer) */}
      {(type === 'income' || type === 'transfer') && (
        <div className="space-y-2">
          <Label htmlFor="to_account_id">
            {type === 'transfer' ? 'To Account' : 'Account'}
          </Label>
          <Select
            name="to_account_id"
            defaultValue={initialData?.to_account_id ?? undefined}
            required
          >
            <SelectTrigger id="to_account_id">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category (income or expense) */}
      {type !== 'transfer' && (
        <div className="space-y-2">
          <Label htmlFor="category_id">Category (optional)</Label>
          <Select
            name="category_id"
            defaultValue={initialData?.category_id ?? undefined}
          >
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {activeCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Add a note..."
          rows={2}
          defaultValue={initialData?.note ?? ''}
        />
      </div>

      <Button
        type="submit"
        className="w-full gradient-primary border-0 text-white font-semibold h-11"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : initialData ? (
          'Update Transaction'
        ) : (
          'Add Transaction'
        )}
      </Button>
    </form>
  )
}
