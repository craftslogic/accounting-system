'use client'

import { useActionState, useEffect } from 'react'
import { createFundTransactionAction } from '@/actions/funds'
import { Button } from '@/components/ui/button'
import type { ActionResult, FundTransaction, Account } from '@/types'

interface FundTransactionFormProps {
  fundId: string
  fundName: string
  fundColor: string
  defaultType?: 'allocate' | 'withdraw' | 'adjustment'
  accounts: Account[]
  onSuccess?: () => void
  onCancel?: () => void
}

const initialState: ActionResult<FundTransaction> = { success: false, error: '' }

const TYPE_CONFIG = {
  allocate: {
    label: 'Add Money',
    description: 'Move money into this fund',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    emoji: '➕',
  },
  withdraw: {
    label: 'Use Money',
    description: 'Use money from this fund',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    emoji: '💸',
  },
  adjustment: {
    label: 'Adjust Balance',
    description: 'Manually set the fund balance',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    emoji: '🔧',
  },
}

export function FundTransactionForm({
  fundId,
  fundColor,
  defaultType = 'allocate',
  accounts,
  onSuccess,
  onCancel,
}: FundTransactionFormProps) {
  const [state, formAction, isPending] = useActionState(
    createFundTransactionAction,
    initialState
  )

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  const today = new Date().toISOString().split('T')[0]
  const typeConfig = TYPE_CONFIG[defaultType]

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="fund_id" value={fundId} />
      <input type="hidden" name="type" value={defaultType} />

      {/* Type indicator */}
      <div className={`flex items-center gap-3 p-3 rounded-xl ${typeConfig.bg} border ${typeConfig.border}`}>
        <span className="text-2xl">{typeConfig.emoji}</span>
        <div>
          <p className={`text-sm font-semibold ${typeConfig.color}`}>{typeConfig.label}</p>
          <p className="text-xs text-muted-foreground">{typeConfig.description}</p>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          {defaultType === 'adjustment' ? 'New Balance Amount' : 'Amount'} *
        </label>
        <input
          name="amount"
          type="number"
          min="1"
          step="1"
          required
          placeholder="0"
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none transition-colors"
          style={{ ['--focus-color' as string]: fundColor }}
        />
      </div>

      {/* Source Account (for allocate only) */}
      {defaultType === 'allocate' && accounts.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            From Account <span className="text-xs text-muted-foreground/60">(optional)</span>
          </label>
          <select
            name="account_id"
            className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="">— Select account —</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Date *</label>
        <input
          name="transaction_date"
          type="date"
          required
          defaultValue={today}
          max={today}
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none transition-colors"
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Note <span className="text-xs text-muted-foreground/60">(optional)</span>
        </label>
        <input
          name="note"
          type="text"
          placeholder="e.g. Monthly allocation…"
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none transition-colors"
        />
      </div>

      {/* Error */}
      {state.success === false && state.error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">
          {state.error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
          style={{ backgroundColor: fundColor }}
        >
          {isPending ? 'Saving…' : typeConfig.label}
        </Button>
      </div>
    </form>
  )
}
