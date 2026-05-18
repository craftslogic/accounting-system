'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateProfileAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { User } from '@supabase/supabase-js'

export function ProfileSettings({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()
  
  const [state, action, isPending] = useActionState(updateProfileAction, null)

  const fullName = (user.user_metadata?.full_name as string) || 'User'
  const avatarUrl = (user.user_metadata?.avatar_url as string) || ''
  const initial = fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    if (state?.success) {
      setIsEditing(false)
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })
    } else if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      })
    }
  }, [state, toast])

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profile</h2>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="flex items-center gap-4 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{fullName}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" defaultValue={fullName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar_file">Profile Picture</Label>
            <Input 
              id="avatar_file" 
              name="avatar_file" 
              type="file" 
              accept="image/*" 
              className="file:text-sm file:font-medium file:text-foreground file:bg-transparent file:border-0 hover:cursor-pointer" 
            />
            <p className="text-xs text-muted-foreground">Select an image to change your profile picture.</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
