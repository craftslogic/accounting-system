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

  if (!data || data.length === 0) return []

  // 1. Determine period dates for each budget and find the earliest start date needed
  let earliestDate = new Date()
  const now = new Date()
  
  const budgetsWithSpent = data.map((b: any) => {
    let start = new Date()
    let end = new Date()

    if (b.period === 'weekly') {
      // Assuming week starts on Monday, or Sunday depending on locale, we'll do Sunday
      const day = now.getDay()
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (b.period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (b.period === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    }
    
    if (start < earliestDate) earliestDate = start
    
    return { ...b, _start: start, _end: end, spent: 0 }
  })

  // 2. Fetch all expense transactions from the earliest start date
  const { data: txs } = await supabase
    .from('transactions')
    .select('amount, category_id, from_account_id, transaction_date')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('transaction_date', earliestDate.toISOString())

  // 3. Accumulate spent amounts
  for (const b of budgetsWithSpent) {
    let spent = 0
    for (const tx of txs || []) {
      const txDate = new Date(tx.transaction_date)
      if (txDate >= b._start && txDate <= b._end) {
        const matchCategory = !b.category_id || tx.category_id === b.category_id
        const matchAccount = !b.account_id || tx.from_account_id === b.account_id
        if (matchCategory && matchAccount) {
          spent += parseFloat(String(tx.amount))
        }
      }
    }
    b.spent = spent
  }

  // Remove temporary date fields
  return budgetsWithSpent.map(({ _start, _end, ...b }) => b)
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
