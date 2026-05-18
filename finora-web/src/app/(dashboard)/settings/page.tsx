import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { ProfileSettings } from './ProfileSettings'
import { DeleteAccountButton } from './DeleteAccountButton'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Info */}
      <ProfileSettings user={user} />

      {/* App Info */}
      <div className="rounded-2xl border border-white/10 bg-card p-6 space-y-4 overflow-hidden">
        <h2 className="text-lg font-semibold">About Finora</h2>
        <div className="space-y-2 text-sm text-muted-foreground w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="shrink-0">Version</span>
            <span className="text-foreground font-medium truncate">1.0.0</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="shrink-0">Database</span>
            <span className="text-foreground font-medium truncate">Supabase PostgreSQL</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="shrink-0">Balance Calculation</span>
            <span className="text-emerald-400 font-medium truncate">Dynamic (no stored balances)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="shrink-0">Security</span>
            <span className="text-foreground font-medium truncate">Row Level Security enabled</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  )
}
