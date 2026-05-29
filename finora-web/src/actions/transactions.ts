'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Transaction } from '@/types'

const TransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.coerce.number().positive('Amount must be positive'),
  category_id: z.string().uuid().optional().nullable(),
  from_account_id: z.string().uuid().optional().nullable(),
  to_account_id: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
}).refine((data) => {
  // Income requires to_account_id
  if (data.type === 'income' && !data.to_account_id) return false
  // Expense requires from_account_id
  if (data.type === 'expense' && !data.from_account_id) return false
  // Transfer requires both
  if (data.type === 'transfer' && (!data.from_account_id || !data.to_account_id)) return false
  // Transfer accounts must be different
  if (data.type === 'transfer' && data.from_account_id === data.to_account_id) return false
  return true
}, {
  message: 'Invalid account selection for transaction type',
})

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function createTransactionAction(
  _prevState: ActionResult<Transaction>,
  formData: FormData
): Promise<ActionResult<Transaction>> {
  const raw = {
    type: formData.get('type'),
    amount: formData.get('amount'),
    category_id: formData.get('category_id') || null,
    from_account_id: formData.get('from_account_id') || null,
    to_account_id: formData.get('to_account_id') || null,
    note: formData.get('note') || null,
    transaction_date: formData.get('transaction_date'),
  }

  const result = TransactionSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  try {
    const { supabase, user } = await getCurrentUser()

    // ── Balance guard: prevent negative balance on expense / transfer ──
    const fromAccountId = result.data.from_account_id
    if ((result.data.type === 'expense' || result.data.type === 'transfer') && fromAccountId) {
      // Compute current balance of the source account from all transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount, from_account_id, to_account_id')
        .eq('user_id', user.id)

      let balance = 0
      for (const tx of txs ?? []) {
        const amt = parseFloat(String(tx.amount))
        if (tx.type === 'income' && tx.to_account_id === fromAccountId) balance += amt
        else if (tx.type === 'expense' && tx.from_account_id === fromAccountId) balance -= amt
        else if (tx.type === 'transfer') {
          if (tx.from_account_id === fromAccountId) balance -= amt
          if (tx.to_account_id === fromAccountId) balance += amt
        }
      }

      if (balance < result.data.amount) {
        return {
          success: false,
          error: `Insufficient balance. Account has PKR ${balance.toLocaleString()} but transaction is PKR ${result.data.amount.toLocaleString()}.`,
        }
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateTransactionAction(
  id: string,
  _prevState: ActionResult<Transaction>,
  formData: FormData
): Promise<ActionResult<Transaction>> {
  const raw = {
    type: formData.get('type'),
    amount: formData.get('amount'),
    category_id: formData.get('category_id') || null,
    from_account_id: formData.get('from_account_id') || null,
    to_account_id: formData.get('to_account_id') || null,
    note: formData.get('note') || null,
    transaction_date: formData.get('transaction_date'),
  }

  const result = TransactionSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  try {
    const { supabase, user } = await getCurrentUser()

    const { data, error } = await supabase
      .from('transactions')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
