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
import { useState } from 'react'

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

  const isInitialCustom = initialData?.type && !['friend', 'family', 'client'].includes(initialData.type)
  const [selectedType, setSelectedType] = useState<string>(isInitialCustom ? 'custom' : (initialData?.type ?? 'friend'))
  const [customType, setCustomType] = useState<string>(isInitialCustom ? initialData!.type : '')

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden input to ensure the correct type is submitted */}
      <input 
        type="hidden" 
        name="type" 
        value={selectedType === 'custom' ? (customType.trim() || 'other') : selectedType} 
      />
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
        <Label htmlFor="typeSelect">Relation Type</Label>
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
          required
        >
          <SelectTrigger id="typeSelect">
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

      {selectedType === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="customType">Custom Relationship</Label>
          <Input 
            id="customType" 
            placeholder="e.g. Mentor, Colleague..." 
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            required 
            autoFocus
          />
        </div>
      )}

      <Button type="submit" className="w-full gradient-primary border-0 text-white" disabled={pending}>
        {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Person'}
      </Button>
    </form>
  )
}
