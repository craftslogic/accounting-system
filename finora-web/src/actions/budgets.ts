'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBudgets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(name, color, icon),
      account:accounts(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching budgets:', error)
    return []
  }

  // To calculate progress, we would ideally fetch transactions for the period.
  // For now, we return the base budgets.
  return data
}

export async function createBudget(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const amount = parseFloat(formData.get('amount') as string)
  const period = formData.get('period') as 'weekly' | 'monthly' | 'yearly'
  const category_id = formData.get('category_id') === 'none' ? null : (formData.get('category_id') as string || null)
  const account_id = formData.get('account_id') === 'none' ? null : (formData.get('account_id') as string || null)

  const { error } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      amount,
      period,
      category_id,
      account_id
    })

  if (error) {
    console.error('Error creating budget:', error)
    throw new Error('Failed to create budget')
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}

export async function deleteBudget(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting budget:', error)
    throw new Error('Failed to delete budget')
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}

export async function updateBudget(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const amount = parseFloat(formData.get('amount') as string)
  const period = formData.get('period') as 'weekly' | 'monthly' | 'yearly'
  const category_id = formData.get('category_id') === 'none' ? null : (formData.get('category_id') as string || null)
  const account_id = formData.get('account_id') === 'none' ? null : (formData.get('account_id') as string || null)

  const { error } = await supabase
    .from('budgets')
    .update({
      amount,
      period,
      category_id,
      account_id
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating budget:', error)
    throw new Error('Failed to update budget')
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}
