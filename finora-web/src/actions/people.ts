'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Contact, PeopleBalance, PeopleSubtype } from '@/types'
import { calculateOutstanding } from '@/utils/people'

// ============================================================
// Schemas
// ============================================================

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['friend', 'family', 'client', 'custom']),
})

/**
 * Opening entry schema — no account balance changes, no transaction.
 * Just establishes a pre-existing liability or receivable.
 */
const OpeningEntrySchema = z.object({
  contact_id: z.string().uuid(),
  entry_type: z.enum(['opening_payable', 'opening_receivable']),
  amount: z.coerce.number().positive('Amount must be positive'),
  account_id: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
})

/**
 * Transaction schema — records an actual financial event.
 * subtype determines what the event is (borrow/lend/repay/collect/adjustment/writeoff)
 */
const PeopleTransactionSchema = z.object({
  contact_id: z.string().uuid(),
  subtype: z.enum(['borrow', 'lend', 'repay', 'collect', 'adjustment', 'writeoff']),
  amount: z.coerce.number().positive('Amount must be positive'),
  account_id: z.string().uuid('Account is required'),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
})

const UpdateBalanceSchema = z.object({
  contact_id: z.string().uuid(),
  type: z.enum(['payable', 'receivable', 'opening_payable', 'opening_receivable']),
  subtype: z.enum(['borrow', 'lend', 'repay', 'collect', 'adjustment', 'writeoff']).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
  account_id: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
})

// ============================================================
// Helpers
// ============================================================

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

/**
 * Maps a subtype to its balance_type (the "direction" stored in DB)
 * - borrow: I received money → payable (I owe them)
 * - lend: I gave money → receivable (they owe me)
 * - repay: I paid back → payable (reduces what I owe)
 * - collect: I received repayment → receivable (reduces what they owe)
 * - adjustment/writeoff: passed through with given type
 */
function subtypeToBalanceType(subtype: PeopleSubtype): 'payable' | 'receivable' {
  switch (subtype) {
    case 'borrow':
    case 'repay':
      return 'payable'
    case 'lend':
    case 'collect':
      return 'receivable'
    default:
      return 'payable'
  }
}

// ============================================================
// Contacts
// ============================================================

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

// ============================================================
// Opening Entries (Pre-Finoraa debts — NO account balance change)
// ============================================================

/**
 * CASE 1 & 2: Record an existing balance that existed BEFORE Finoraa.
 * This does NOT touch account balances. It only creates an opening entry.
 * Net worth is adjusted conceptually (payable decreases NW, receivable increases NW).
 */
export async function createOpeningEntryAction(
  _prevState: ActionResult<PeopleBalance>,
  formData: FormData
): Promise<ActionResult<PeopleBalance>> {
  const accountIdRaw = formData.get('account_id')
  const accountId = accountIdRaw === 'none' || accountIdRaw === '' ? null : accountIdRaw

  const result = OpeningEntrySchema.safeParse({
    contact_id: formData.get('contact_id'),
    entry_type: formData.get('entry_type'),
    amount: formData.get('amount'),
    account_id: accountId,
    note: formData.get('note'),
    transaction_date: formData.get('transaction_date'),
  })

  if (!result.success) return { success: false, error: result.error.message }

  try {
    const { supabase, user } = await getCurrentUser()

    const { data, error } = await supabase
      .from('people_balances')
      .insert({
        user_id: user.id,
        contact_id: result.data.contact_id,
        type: result.data.entry_type,
        subtype: null, // opening entries have no subtype
        amount: result.data.amount,
        account_id: result.data.account_id ?? null,
        note: result.data.note ?? null,
        transaction_date: result.data.transaction_date,
      })
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

// ============================================================
// Live Transactions (After Finoraa — WITH account balance changes)
// ============================================================

/**
 * CASE 3: Borrow money from someone
 * - Account balance +amount (cash received)
 * - Payable +amount (I now owe them)
 * - Creates a real transaction in people_balances with subtype='borrow'
 *
 * CASE 4: Lend money to someone
 * - Account balance -amount (cash paid out)
 * - Receivable +amount (they now owe me)
 * - Creates a real transaction in people_balances with subtype='lend'
 *
 * CASE 5: Repay debt
 * - Account balance -amount (cash paid out)
 * - Payable offset (reduces what I owe)
 * - Creates a real transaction with subtype='repay'
 *
 * CASE 6: Collect repayment
 * - Account balance +amount (cash received)
 * - Receivable offset (reduces what they owe me)
 * - Creates a real transaction with subtype='collect'
 */
export async function createPeopleTransactionAction(
  _prevState: ActionResult<PeopleBalance>,
  formData: FormData
): Promise<ActionResult<PeopleBalance>> {
  const result = PeopleTransactionSchema.safeParse({
    contact_id: formData.get('contact_id'),
    subtype: formData.get('subtype'),
    amount: formData.get('amount'),
    account_id: formData.get('account_id'),
    note: formData.get('note'),
    transaction_date: formData.get('transaction_date'),
  })

  if (!result.success) return { success: false, error: result.error.message }

  try {
    const { supabase, user } = await getCurrentUser()
    const { subtype, amount, account_id, contact_id, note, transaction_date } = result.data

    // Validate outstanding balance for repay/collect to warn on overpayment
    if (subtype === 'repay' || subtype === 'collect') {
      const outstanding = await getOutstandingBalance(supabase, user.id, contact_id, subtype === 'repay' ? 'payable' : 'receivable')
      if (amount > outstanding + 0.01) {
        return {
          success: false,
          error: `OVERPAYMENT:${outstanding.toFixed(2)}`, // special prefix for client-side handling
        }
      }
    }

    // Determine the balance_type direction
    const balanceType = subtypeToBalanceType(subtype)

    // Step 1: Create the account transaction
    let txType: 'income' | 'expense'
    let fromAccountId: string | null = null
    let toAccountId: string | null = null

    // borrow: money comes IN → external transfer to account
    // lend: money goes OUT → external transfer from account
    // repay: money goes OUT → external transfer from account
    // collect: money comes IN → external transfer to account
    const isInflow = subtype === 'borrow' || subtype === 'collect'
    if (isInflow) {
      txType = 'income'
      toAccountId = account_id
    } else {
      txType = 'expense'
      fromAccountId = account_id
    }

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: txType,
      amount,
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      note: note ?? `People: ${subtype}`,
      transaction_date,
    })

    if (txError) return { success: false, error: `Account update failed: ${txError.message}` }

    // Step 2: Create the people_balances entry
    const { data, error } = await supabase
      .from('people_balances')
      .insert({
        user_id: user.id,
        contact_id,
        type: balanceType,
        subtype,
        amount,
        account_id,
        note: note ?? null,
        transaction_date,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/people')
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// Overpayment conversion helper
// ============================================================

/**
 * CASE 8: Overpayment handling
 * If user repays more than owed, convert the excess to an opposite balance.
 * e.g., owed 20,000, repaid 25,000 → now they owe you 5,000
 */
export async function handleOverpaymentAction(
  contactId: string,
  subtype: 'repay' | 'collect',
  totalAmount: number,
  outstanding: number,
  accountId: string,
  note: string | null,
  transactionDate: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    const exactAmount = outstanding
    const excessAmount = totalAmount - outstanding

    // Step 1: Settle the outstanding amount fully
    const settleSubtype = subtype
    const settleBalanceType = subtype === 'repay' ? 'payable' : 'receivable'
    const isInflow = subtype === 'collect'

    // Account transaction for full repayment
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: isInflow ? 'income' : 'expense',
      amount: totalAmount,
      from_account_id: isInflow ? null : accountId,
      to_account_id: isInflow ? accountId : null,
      note: note ?? `People: ${subtype} (with overpayment conversion)`,
      transaction_date: transactionDate,
    })

    // Settle the full outstanding
    await supabase.from('people_balances').insert({
      user_id: user.id,
      contact_id: contactId,
      type: settleBalanceType,
      subtype: settleSubtype,
      amount: exactAmount,
      account_id: accountId,
      note: note ?? null,
      transaction_date: transactionDate,
    })

    // Convert excess to opposite direction
    // If I repaid MORE than I owed → they now owe me the excess
    // If they repaid MORE than they owed → I now owe them the excess
    const oppositeSubtype = subtype === 'repay' ? 'lend' : 'borrow'
    const oppositeType = subtype === 'repay' ? 'receivable' : 'payable'

    await supabase.from('people_balances').insert({
      user_id: user.id,
      contact_id: contactId,
      type: oppositeType,
      subtype: oppositeSubtype,
      amount: excessAmount,
      account_id: accountId,
      note: `Excess from overpayment conversion`,
      transaction_date: transactionDate,
    })

    revalidatePath('/people')
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// Debt forgiveness / Write-Off (CASE 9)
// ============================================================

export async function writeOffBalanceAction(
  contactId: string,
  balanceDirection: 'payable' | 'receivable',
  amount: number,
  note: string | null
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    await supabase.from('people_balances').insert({
      user_id: user.id,
      contact_id: contactId,
      type: balanceDirection,
      subtype: 'writeoff',
      amount,
      account_id: null,
      note: note ?? 'Debt written off / forgiven',
      transaction_date: new Date().toISOString().split('T')[0],
    })

    revalidatePath('/people')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// Update / Delete
// ============================================================

export async function updatePeopleBalanceAction(
  id: string,
  _prevState: ActionResult<PeopleBalance>,
  formData: FormData
): Promise<ActionResult<PeopleBalance>> {
  const result = UpdateBalanceSchema.safeParse({
    contact_id: formData.get('contact_id'),
    type: formData.get('type'),
    subtype: formData.get('subtype') || null,
    amount: formData.get('amount'),
    account_id: formData.get('account_id') || null,
    note: formData.get('note'),
    transaction_date: formData.get('transaction_date'),
  })

  if (!result.success) return { success: false, error: result.error.message }

  try {
    const { supabase, user } = await getCurrentUser()
    
    // Fetch old record first to find the linked transaction
    const { data: oldRecord, error: fetchError } = await supabase
      .from('people_balances')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !oldRecord) {
      return { success: false, error: fetchError?.message || 'Record not found' }
    }

    const { data, error } = await supabase
      .from('people_balances')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Try to update the associated transaction if it exists
    if (oldRecord.account_id) {
      const isOldInflow = oldRecord.subtype === 'borrow' || oldRecord.subtype === 'collect'
      const oldExpectedType = isOldInflow ? 'income' : 'expense'
      const oldExpectedNote = oldRecord.note ?? `People: ${oldRecord.subtype}`

      const { data: txs } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', oldExpectedType)
        .eq('amount', oldRecord.amount)
        .eq('transaction_date', oldRecord.transaction_date)
        .eq(isOldInflow ? 'to_account_id' : 'from_account_id', oldRecord.account_id)
        .eq('note', oldExpectedNote)
        .limit(1)

      if (txs && txs.length > 0) {
        const isNewInflow = result.data.subtype === 'borrow' || result.data.subtype === 'collect'
        await supabase
          .from('transactions')
          .update({
            type: isNewInflow ? 'income' : 'expense',
            amount: result.data.amount,
            transaction_date: result.data.transaction_date,
            note: result.data.note ?? `People: ${result.data.subtype}`,
            from_account_id: isNewInflow ? null : result.data.account_id,
            to_account_id: isNewInflow ? result.data.account_id : null,
          })
          .eq('id', txs[0].id)
      }
    }

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
    
    // Fetch old record first to find the linked transaction
    const { data: oldRecord, error: fetchError } = await supabase
      .from('people_balances')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      
    if (fetchError || !oldRecord) {
      return { success: false, error: fetchError?.message || 'Record not found' }
    }

    const { error } = await supabase
      .from('people_balances')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    // Try to delete the associated transaction if it exists
    if (oldRecord.account_id) {
      const isInflow = oldRecord.subtype === 'borrow' || oldRecord.subtype === 'collect'
      const expectedType = isInflow ? 'income' : 'expense'
      const expectedNote = oldRecord.note ?? `People: ${oldRecord.subtype}`

      const { data: txs } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', expectedType)
        .eq('amount', oldRecord.amount)
        .eq('transaction_date', oldRecord.transaction_date)
        .eq(isInflow ? 'to_account_id' : 'from_account_id', oldRecord.account_id)
        .eq('note', expectedNote)
        .limit(1)

      if (txs && txs.length > 0) {
        await supabase.from('transactions').delete().eq('id', txs[0].id)
      }
    }

    revalidatePath('/people')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// Balance Calculation Helpers
// ============================================================

/**
 * Calculate outstanding balance for a specific direction (payable or receivable) 
 * for a given contact.
 *
 * Outstanding Payable = opening_payable + borrow - repay - writeoff(payable)
 * Outstanding Receivable = opening_receivable + lend - collect - writeoff(receivable)
 */
async function getOutstandingBalance(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  contactId: string,
  direction: 'payable' | 'receivable'
): Promise<number> {
  const { data: rows } = await (supabase as any)
    .from('people_balances')
    .select('type, subtype, amount')
    .eq('user_id', userId)
    .eq('contact_id', contactId)

  return calculateOutstanding(rows ?? [], direction)
}


/**
 * Legacy action kept for backwards compatibility.
 * Prefer createPeopleTransactionAction with subtype='repay'/'collect'.
 */
export async function clearContactBalanceAction(contactId: string, customAmount?: number): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    const { data: balances } = await supabase
      .from('people_balances')
      .select('type, subtype, amount')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)

    const outstandingPayable = calculateOutstanding(balances ?? [], 'payable')
    const outstandingReceivable = calculateOutstanding(balances ?? [], 'receivable')
    const net = outstandingReceivable - outstandingPayable

    if (net === 0 && outstandingPayable === 0 && outstandingReceivable === 0) {
      return { success: true, data: undefined }
    }

    const isPayable = net < 0 // I owe them
    const fullOutstanding = Math.abs(net)
    const amount = customAmount !== undefined ? customAmount : fullOutstanding

    if (amount <= 0) {
      return { success: false, error: 'Settlement amount must be greater than zero' }
    }

    const subtype = isPayable ? 'repay' : 'collect'
    const type = isPayable ? 'payable' : 'receivable'

    const { error: insertError } = await supabase
      .from('people_balances')
      .insert({
        contact_id: contactId,
        user_id: user.id,
        type,
        subtype,
        amount,
        account_id: null,
        note: customAmount !== undefined ? `Settled ${amount} installment` : 'Settled balance manually',
        transaction_date: new Date().toISOString().split('T')[0],
      })

    if (insertError) return { success: false, error: insertError.message }

    revalidatePath('/people')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

