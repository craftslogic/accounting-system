'use client'

import { useState } from 'react'
import { Plus, MoreVertical, Edit, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { AccountCard } from '@/components/accounts/AccountCard'
import { AccountForm } from '@/components/accounts/AccountForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleArchiveAccountAction, deleteAccountAction } from '@/actions/accounts'
import { toast } from '@/hooks/use-toast'
import type { AccountWithBalance } from '@/types'

interface AccountsClientProps {
  accounts: AccountWithBalance[]
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<AccountWithBalance | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const activeAccounts = accounts.filter((a) => !a.is_archived)
  const archivedAccounts = accounts.filter((a) => a.is_archived)
  const displayedAccounts = showArchived ? archivedAccounts : activeAccounts

  const handleArchive = async (account: AccountWithBalance) => {
    const result = await toggleArchiveAccountAction(account.id, !account.is_archived)
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({
        title: account.is_archived ? 'Account unarchived' : 'Account archived',
        variant: 'success' as never,
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account? All related transactions remain.')) return
    const result = await deleteAccountAction(id)
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Account deleted', variant: 'success' as never })
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {archivedAccounts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Show Active' : `Archived (${archivedAccounts.length})`}
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-white">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Account</DialogTitle>
              </DialogHeader>
              <AccountForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Accounts Grid */}
      {displayedAccounts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card p-12 text-center">
          <div className="text-4xl mb-4">🏦</div>
          <h3 className="text-lg font-semibold mb-2">
            {showArchived ? 'No archived accounts' : 'No accounts yet'}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {!showArchived && 'Add your first account to start tracking your finances.'}
          </p>
          {!showArchived && (
            <Button
              className="gradient-primary border-0 text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create Account
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditAccount(account)}>
                      <Edit className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleArchive(account)}>
                      {account.is_archived ? (
                        <><ArchiveRestore className="w-4 h-4" /> Unarchive</>
                      ) : (
                        <><Archive className="w-4 h-4" /> Archive</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-400"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editAccount && (
            <AccountForm
              initialData={editAccount}
              onSuccess={() => setEditAccount(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
