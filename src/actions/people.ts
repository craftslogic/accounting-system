'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Contact, PeopleBalance } from '@/types'

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['friend', 'family', 'client', 'custom']),
})

const BalanceSchema = z.object({
  contact_id: z.string().uuid(),
  type: z.enum(['payable', 'receivable']),
  amount: z.coerce.number().positive('Amount must be positive'),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
})

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

// Contacts
export async function createContactAction(
  _prevState: ActionResult<Contact>,
  formData: FormData
): Promise<ActionResult<Contact>> {
  const result = ContactSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  })

  if (!result.success) return { success: false, error: result.error.message }

  try {
    const { supabase, user } = await getCurrentUser()
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/people')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateContactAction(
  id: string,
  _prevState: ActionResult<Contact>,
  formData: FormData
): Promise<ActionResult<Contact>> {
  const result = ContactSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  })

  if (!result.success) return { success: false, error: result.error.message }

  try {
    const { supabase, user } = await getCurrentUser()
    const { data, error } = await supabase
      .from('contacts')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/people')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Balances (Transactions)
export async function createPeopleBalanceAction(
  _prevState: ActionResult<PeopleBalance>,
  formData: FormData
): Promise<ActionResult<PeopleBalance>> {
  const result = BalanceSchema.safeParse({
    contact_id: formData.get('contact_id'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    note: formData.get('note'),
    transaction_date: formData.get('transaction_date'),
  })

  if (!result.success) return { success: false, error: result.error.message }

  try {
    const { supabase, user } = await getCurrentUser()
    const { data, error } = await supabase
      .from('people_balances')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/people')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deletePeopleBalanceAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('people_balances')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/people')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
