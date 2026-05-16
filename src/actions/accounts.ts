'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Account } from '@/types'

// ---- Schema ----
const AccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50),
  type: z.enum(['cash', 'bank', 'wallet', 'savings', 'custom']),
  currency: z.string().min(3).max(3),
})

// ---- Get current user (helper) ----
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

// ---- Create Account ----
export async function createAccountAction(
  _prevState: ActionResult<Account>,
  formData: FormData
): Promise<ActionResult<Account>> {
  const result = AccountSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    currency: formData.get('currency'),
  })

  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  try {
    const { supabase, user } = await getCurrentUser()

    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ---- Update Account ----
export async function updateAccountAction(
  id: string,
  _prevState: ActionResult<Account>,
  formData: FormData
): Promise<ActionResult<Account>> {
  const result = AccountSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    currency: formData.get('currency'),
  })

  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  try {
    const { supabase, user } = await getCurrentUser()

    const { data, error } = await supabase
      .from('accounts')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ---- Archive / Unarchive Account ----
export async function toggleArchiveAccountAction(
  id: string,
  is_archived: boolean
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    const { error } = await supabase
      .from('accounts')
      .update({ is_archived })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ---- Delete Account ----
export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
