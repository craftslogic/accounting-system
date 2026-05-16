'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { createContactAction, updateContactAction } from '@/actions/people'
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
import type { Contact, ActionResult } from '@/types'

interface ContactFormProps {
  initialData?: Contact
  onSuccess?: () => void
}

const initialState: ActionResult<Contact> = { success: false, error: '' }

export function ContactForm({ initialData, onSuccess }: ContactFormProps) {
  const action = initialData
    ? updateContactAction.bind(null, initialData.id)
    : createContactAction

  const [state, formAction, pending] = useActionState(
    action as (prevState: ActionResult<Contact>, formData: FormData) => Promise<ActionResult<Contact>>,
    initialState
  )

  useEffect(() => {
    if (state?.success) {
      toast({ title: initialData ? 'Contact updated' : 'Contact added', variant: 'success' as never })
      onSuccess?.()
    }
  }, [state?.success])

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="E.g. Ali" defaultValue={initialData?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Relation Type</Label>
        <Select name="type" defaultValue={initialData?.type ?? 'friend'} required>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={(e) => {
              // Prevent dialog closing when clicking select
              e.stopPropagation()
            }}
          >
            <SelectItem value="friend">Friend</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="custom">Other / Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full gradient-primary border-0 text-white" disabled={pending}>
        {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Person'}
      </Button>
    </form>
  )
}
