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

export function AccountForm({ initialData, onSuccess }: AccountFormProps) {
  const action = initialData
    ? updateAccountAction.bind(null, initialData.id)
    : createAccountAction

  const [state, formAction, pending] = useActionState(
    action as (prevState: ActionResult<Account>, formData: FormData) => Promise<ActionResult<Account>>,
    initialState
  )

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

      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Chase Bank"
          defaultValue={initialData?.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Account Type</Label>
        <Select name="type" defaultValue={initialData?.type ?? 'bank'} required>
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
        <Select name="currency" defaultValue={initialData?.currency ?? 'USD'} required>
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
