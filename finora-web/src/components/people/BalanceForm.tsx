'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { createPeopleBalanceAction } from '@/actions/people'
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
import type { ContactWithBalance, PeopleBalance, BalanceType, ActionResult } from '@/types'

interface BalanceFormProps {
  contacts: ContactWithBalance[]
  onSuccess?: () => void
}

const initialState: ActionResult<PeopleBalance> = { success: false, error: '' }

export function BalanceForm({ contacts, onSuccess }: BalanceFormProps) {
  const [type, setType] = useState<BalanceType | 'opening_payable' | 'opening_receivable'>('payable')
  const [isOpening, setIsOpening] = useState(false)

  const [state, formAction, pending] = useActionState(
    createPeopleBalanceAction as (prevState: ActionResult<PeopleBalance>, formData: FormData) => Promise<ActionResult<PeopleBalance>>,
    initialState
  )

  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Balance recorded successfully', variant: 'success' as never })
      onSuccess?.()
    }
  }, [state?.success])

  if (contacts.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground text-sm">Please add a person first from the "Add Person" button before recording balances.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label>Record Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['payable', 'receivable'] as BalanceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                type === t
                  ? t === 'payable'
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'border-input bg-background hover:bg-accent'
              }`}
            >
              {t === 'payable' ? 'I Owe Them (Given)' : 'They Owe Me (Received)'}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={isOpening ? `opening_${type}` : type} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isOpening"
            checked={isOpening}
            onChange={(e) => setIsOpening(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="isOpening" className="text-sm font-medium cursor-pointer">
            This is an opening balance
          </Label>
        </div>
        {isOpening && (
          <p className="text-xs text-muted-foreground pl-6">
            Enter the amount already outstanding before you started using Finora.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_id">Select Person</Label>
        <Select name="contact_id" required>
          <SelectTrigger id="contact_id">
            <SelectValue placeholder="Select who this is for" />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={(e) => {
              // Prevent dialog closing when clicking select
              e.stopPropagation()
            }}
          >
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_date">Date</Label>
        <Input id="transaction_date" name="transaction_date" type="date" defaultValue={today()} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (Optional)</Label>
        <Textarea id="note" name="note" placeholder="E.g. Dinner split, loan for rent..." />
      </div>

      <Button type="submit" className="w-full gradient-primary border-0 text-white" disabled={pending}>
        {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recording...</> : 'Record Balance'}
      </Button>
    </form>
  )
}
