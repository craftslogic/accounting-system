'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { createAccountAction, updateAccountAction } from '@/actions/accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { CURRENCIES } from '@/lib/utils'
import type { Account, ActionResult } from '@/types'

interface AccountFormProps {
  initialData?: Account
  onSuccess?: () => void
}

const initialState: ActionResult<Account> = { success: false, error: '' }

const ACCOUNT_TYPES = ['cash', 'bank', 'wallet', 'savings', 'custom'] as const

const COMMON_BANKS = [
  { name: 'Meezan Bank', type: 'bank', icon: '🏦' },
  { name: 'HBL', type: 'bank', icon: '🏦' },
  { name: 'ABL', type: 'bank', icon: '🏦' },
  { name: 'Nayapay', type: 'wallet', icon: '📱' },
  { name: 'SadaPay', type: 'wallet', icon: '📱' },
  { name: 'Easypaisa', type: 'wallet', icon: '📞' },
  { name: 'JazzCash', type: 'wallet', icon: '📞' }
]

export function AccountForm({ initialData, onSuccess }: AccountFormProps) {
  const action = initialData
    ? updateAccountAction.bind(null, initialData.id)
    : createAccountAction

  const [state, formAction, pending] = useActionState(
    action as (prevState: ActionResult<Account>, formData: FormData) => Promise<ActionResult<Account>>,
    initialState
  )

  const [name, setName] = useState(initialData?.name || '')
  const [type, setType] = useState<string>(initialData?.type ?? 'bank')

  const handleBankSelect = (bank: typeof COMMON_BANKS[0]) => {
    setName(bank.name)
    setType(bank.type)
  }

  useEffect(() => {
    if (state?.success) {
      toast({ title: initialData ? 'Account updated' : 'Account created', variant: 'success' as never })
      onSuccess?.()
    }
  }, [state?.success])

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {!initialData && (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Quick Select (PK)</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_BANKS.map((bank) => (
              <button
                key={bank.name}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted/50 border border-white/5 rounded-full hover:bg-muted hover:border-white/10 transition-colors"
                onClick={() => handleBankSelect(bank)}
              >
                <span>{bank.icon}</span>
                {bank.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Chase Bank"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Account Type</Label>
        <Select name="type" value={type} onValueChange={setType} required>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select name="currency" defaultValue={initialData?.currency ?? 'PKR'} required>
          <SelectTrigger id="currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.name} ({c.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!initialData && (
        <div className="space-y-2">
          <Label htmlFor="initial_balance">Initial Balance (Optional)</Label>
          <Input
            id="initial_balance"
            name="initial_balance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full gradient-primary border-0 text-white font-semibold h-11"
        disabled={pending}
      >
        {pending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : initialData ? 'Update Account' : 'Create Account'}
      </Button>
    </form>
  )
}
