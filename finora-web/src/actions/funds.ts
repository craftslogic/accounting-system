'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Fund, FundTransaction, FundWithStats, FundDashboardStats } from '@/types'

// ---- Schemas ----
const FundSchema = z.object({
  name: z.string().min(1, 'Fund name is required').max(80),
  type: z.string().min(1).max(50).default('custom'),
  target_amount: z.coerce.number().positive().optional().nullable(),
  color: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  initial_balance: z.coerce.number().min(0).optional(),
})

const FundTransactionSchema = z.object({
  fund_id: z.string().uuid(),
  account_id: z.string().uuid().optional().nullable(),
  type: z.enum(['allocate', 'withdraw', 'adjustment']),
  amount: z.coerce.number().positive('Amount must be positive'),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
})

const FundRecurringSchema = z.object({
  fund_id: z.string().uuid(),
  account_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  next_date: z.string().min(1),
  auto_generate_transaction: z.boolean().default(false),
  auto_reminder: z.boolean().default(true),
  note: z.string().max(500).optional().nullable(),
})

// ---- Auth helper ----
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

// ============================================================
// FUND CRUD
// ============================================================

export async function createFundAction(
  _prevState: ActionResult<Fund>,
  formData: FormData
): Promise<ActionResult<Fund>> {
  const raw = {
    name: formData.get('name'),
    type: formData.get('type') || 'custom',
    target_amount: formData.get('target_amount') || null,
    color: formData.get('color'),
    icon: formData.get('icon'),
    description: formData.get('description') || null,
    initial_balance: formData.get('initial_balance'),
  }

  const result = FundSchema.safeParse(raw)
  if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' }

  try {
    const { supabase, user } = await getCurrentUser()
    const { data, error } = await supabase
      .from('funds')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    if (result.data.initial_balance && result.data.initial_balance > 0) {
      await supabase.from('fund_transactions').insert({
        user_id: user.id,
        fund_id: data.id,
        type: 'opening_balance',
        amount: result.data.initial_balance,
        note: 'Opening Balance',
        transaction_date: new Date().toISOString().split('T')[0]
      })
      
      await supabase
        .from('funds')
        .update({ current_amount: result.data.initial_balance })
        .eq('id', data.id)
        .eq('user_id', user.id)
    }

    revalidatePath('/funds')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateFundAction(
  id: string,
  _prevState: ActionResult<Fund>,
  formData: FormData
): Promise<ActionResult<Fund>> {
  const raw = {
    name: formData.get('name'),
    type: formData.get('type') || 'custom',
    target_amount: formData.get('target_amount') || null,
    color: formData.get('color'),
    icon: formData.get('icon'),
    description: formData.get('description') || null,
  }

  const result = FundSchema.safeParse(raw)
  if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' }

  try {
    const { supabase, user } = await getCurrentUser()
    const { data, error } = await supabase
      .from('funds')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/funds')
    revalidatePath(`/funds/${id}`)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function toggleArchiveFundAction(
  id: string,
  is_archived: boolean
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('funds')
      .update({ is_archived })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/funds')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteFundAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('funds')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/funds')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// FUND TRANSACTIONS
// ============================================================

export async function createFundTransactionAction(
  _prevState: ActionResult<FundTransaction>,
  formData: FormData
): Promise<ActionResult<FundTransaction>> {
  const raw = {
    fund_id: formData.get('fund_id'),
    account_id: formData.get('account_id') || null,
    type: formData.get('type'),
    amount: formData.get('amount'),
    note: formData.get('note') || null,
    transaction_date: formData.get('transaction_date'),
  }

  const result = FundTransactionSchema.safeParse(raw)
  if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' }

  try {
    const { supabase, user } = await getCurrentUser()

    // Insert the fund transaction
    const { data: txData, error: txError } = await supabase
      .from('fund_transactions')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (txError) return { success: false, error: txError.message }

    // Update fund's current_amount
    const { data: fund } = await supabase
      .from('funds')
      .select('current_amount')
      .eq('id', result.data.fund_id)
      .eq('user_id', user.id)
      .single()

    if (fund) {
      const currentAmount = parseFloat(String(fund.current_amount))
      const txAmount = result.data.amount
      let newAmount = currentAmount

      if (result.data.type === 'allocate') {
        newAmount = currentAmount + txAmount
      } else if (result.data.type === 'withdraw') {
        newAmount = Math.max(0, currentAmount - txAmount)
      } else if (result.data.type === 'adjustment') {
        newAmount = txAmount // Set directly to the new amount
      }

      await supabase
        .from('funds')
        .update({ current_amount: newAmount })
        .eq('id', result.data.fund_id)
        .eq('user_id', user.id)
    }

    revalidatePath('/funds')
    revalidatePath(`/funds/${result.data.fund_id}`)
    revalidatePath('/dashboard')
    return { success: true, data: txData }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteFundTransactionAction(
  id: string,
  fundId: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    // Get the transaction to reverse its effect
    const { data: tx } = await supabase
      .from('fund_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!tx) return { success: false, error: 'Transaction not found' }

    const { error } = await supabase
      .from('fund_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    // Reverse the fund amount
    const { data: fund } = await supabase
      .from('funds')
      .select('current_amount')
      .eq('id', fundId)
      .eq('user_id', user.id)
      .single()

    if (fund) {
      const currentAmount = parseFloat(String(fund.current_amount))
      const txAmount = parseFloat(String(tx.amount))
      let newAmount = currentAmount

      if (tx.type === 'allocate') {
        newAmount = Math.max(0, currentAmount - txAmount)
      } else if (tx.type === 'withdraw') {
        newAmount = currentAmount + txAmount
      }

      await supabase
        .from('funds')
        .update({ current_amount: newAmount })
        .eq('id', fundId)
        .eq('user_id', user.id)
    }

    revalidatePath('/funds')
    revalidatePath(`/funds/${fundId}`)
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// RECURRING FUND ALLOCATIONS
// ============================================================

export async function createFundRecurringAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    fund_id: formData.get('fund_id'),
    account_id: formData.get('account_id') || null,
    amount: formData.get('amount'),
    frequency: formData.get('frequency'),
    next_date: formData.get('next_date'),
    auto_generate_transaction: formData.get('auto_generate_transaction') === 'true',
    auto_reminder: formData.get('auto_reminder') !== 'false',
    note: formData.get('note') || null,
  }

  const result = FundRecurringSchema.safeParse(raw)
  if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' }

  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('fund_recurring')
      .insert({ ...result.data, user_id: user.id })

    if (error) return { success: false, error: error.message }
    revalidatePath('/funds')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteFundRecurringAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('fund_recurring')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/funds')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// DATA FETCHERS
// ============================================================

export async function getFunds(): Promise<FundWithStats[]> {
  const { supabase, user } = await getCurrentUser()

  const { data: funds } = await supabase
    .from('funds')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (!funds) return []

  // For each fund, get total allocated / withdrawn from transactions
  const { data: txs } = await supabase
    .from('fund_transactions')
    .select('fund_id, type, amount')
    .eq('user_id', user.id)

  const statsMap: Record<string, { allocated: number; withdrawn: number }> = {}
  for (const tx of txs ?? []) {
    if (!statsMap[tx.fund_id]) statsMap[tx.fund_id] = { allocated: 0, withdrawn: 0 }
    const amt = parseFloat(String(tx.amount))
    if (tx.type === 'allocate') statsMap[tx.fund_id].allocated += amt
    else if (tx.type === 'withdraw') statsMap[tx.fund_id].withdrawn += amt
  }

  return funds.map((f) => {
    const current = parseFloat(String(f.current_amount))
    const target = f.target_amount ? parseFloat(String(f.target_amount)) : null
    const stats = statsMap[f.id] ?? { allocated: 0, withdrawn: 0 }
    return {
      ...f,
      current_amount: current,
      target_amount: target,
      progress_percentage: target && target > 0 ? Math.min(100, (current / target) * 100) : 0,
      remaining_amount: target ? Math.max(0, target - current) : null,
      total_allocated: stats.allocated,
      total_withdrawn: stats.withdrawn,
    }
  })
}

export async function getFundById(id: string): Promise<FundWithStats | null> {
  const { supabase, user } = await getCurrentUser()

  const { data: fund } = await supabase
    .from('funds')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!fund) return null

  const { data: txs } = await supabase
    .from('fund_transactions')
    .select('type, amount')
    .eq('fund_id', id)
    .eq('user_id', user.id)

  let allocated = 0
  let withdrawn = 0
  for (const tx of txs ?? []) {
    const amt = parseFloat(String(tx.amount))
    if (tx.type === 'allocate') allocated += amt
    else if (tx.type === 'withdraw') withdrawn += amt
  }

  const current = parseFloat(String(fund.current_amount))
  const target = fund.target_amount ? parseFloat(String(fund.target_amount)) : null

  return {
    ...fund,
    current_amount: current,
    target_amount: target,
    progress_percentage: target && target > 0 ? Math.min(100, (current / target) * 100) : 0,
    remaining_amount: target ? Math.max(0, target - current) : null,
    total_allocated: allocated,
    total_withdrawn: withdrawn,
  }
}

export async function getFundTransactions(fundId: string) {
  const { supabase, user } = await getCurrentUser()

  const { data } = await supabase
    .from('fund_transactions')
    .select(`
      *,
      account:accounts(id, name, type, currency)
    `)
    .eq('fund_id', fundId)
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getFundRecurring(fundId: string) {
  const { supabase, user } = await getCurrentUser()

  const { data } = await supabase
    .from('fund_recurring')
    .select(`
      *,
      account:accounts(id, name, type)
    `)
    .eq('fund_id', fundId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getFundDashboardStats(): Promise<FundDashboardStats> {
  const { supabase, user } = await getCurrentUser()

  const { data: funds } = await supabase
    .from('funds')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)

  if (!funds || funds.length === 0) {
    return { totalReserved: 0, totalFunds: 0, activeFunds: 0, highestFund: null, monthlyAllocations: 0 }
  }

  const totalReserved = funds.reduce((sum, f) => sum + parseFloat(String(f.current_amount)), 0)

  // Sort by current_amount descending for highest funded
  const sorted = [...funds].sort((a, b) =>
    parseFloat(String(b.current_amount)) - parseFloat(String(a.current_amount))
  )

  // Monthly allocations (current month)
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const { data: monthlyTxs } = await supabase
    .from('fund_transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'allocate')
    .gte('transaction_date', monthStart)

  const monthlyAllocations = (monthlyTxs ?? []).reduce(
    (sum, tx) => sum + parseFloat(String(tx.amount)), 0
  )

  return {
    totalReserved,
    totalFunds: funds.length,
    activeFunds: funds.length,
    highestFund: sorted[0] ?? null,
    monthlyAllocations,
  }
}

export async function getAllFundsForDashboard() {
  const { supabase, user } = await getCurrentUser()

  const { data: funds } = await supabase
    .from('funds')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('current_amount', { ascending: false })
    .limit(3)

  return (funds ?? []).map(f => ({
    ...f,
    current_amount: parseFloat(String(f.current_amount)),
    target_amount: f.target_amount ? parseFloat(String(f.target_amount)) : null,
  }))
}
