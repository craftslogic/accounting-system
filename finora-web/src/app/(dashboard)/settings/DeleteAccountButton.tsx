'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccountAction } from '@/actions/auth'
import { useToast } from '@/hooks/use-toast'

export function DeleteAccountButton() {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccountAction()
      if (result.success) {
        toast({
          title: 'Account deleted',
          description: 'Your account has been deleted successfully.',
        })
      } else {
        toast({
          title: 'Failed to delete account',
          description: result.error || 'An error occurred.',
          variant: 'destructive',
        })
        setIsOpen(false)
      }
    })
  }

  if (isOpen) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-red-400">Are you absolutely sure?</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Yes, Delete My Account'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
    >
      Delete Account
    </button>
  )
}
