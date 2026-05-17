'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCharities() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('recurring_charity')
    .select(`
      *,
      account:accounts(name)
    `)
    .eq('user_id', user.id)
    .order('next_date', { ascending: true })

  if (error) {
    console.error('Error fetching charity:', error)
    return []
  }

  return data
}

export async function createCharityRecord(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const amount = parseFloat(formData.get('amount') as string)
  const frequency = formData.get('frequency') as 'daily' | 'weekly' | 'monthly' | 'yearly'
  const account_id = formData.get('account_id') === 'none' ? null : (formData.get('account_id') as string || null)
  const note = formData.get('note') as string
  const auto_generate_transaction = formData.get('auto_generate_transaction') === 'true'
  const auto_reminder = formData.get('auto_reminder') !== 'false'
  const next_date = formData.get('next_date') as string || new Date().toISOString()

  const { error } = await supabase
    .from('recurring_charity')
    .insert({
      user_id: user.id,
      amount,
      frequency,
      account_id,
      note,
      auto_generate_transaction,
      auto_reminder,
      next_date
    })

  if (error) {
    console.error('Error creating charity:', error)
    throw new Error('Failed to create charity record')
  }

  revalidatePath('/charity')
}
