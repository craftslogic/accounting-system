import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { ProfileSettings } from './ProfileSettings'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Info */}
      <ProfileSettings user={user} />

      {/* App Info */}
      <div className="rounded-2xl border border-white/10 bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">About Finora</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-foreground font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span>
            <span className="text-foreground font-medium">Supabase PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span>Balance Calculation</span>
            <span className="text-emerald-400 font-medium">Dynamic (no stored balances)</span>
          </div>
          <div className="flex justify-between">
            <span>Security</span>
            <span className="text-foreground font-medium">Row Level Security enabled</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
          disabled
          title="Contact support to delete your account"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
