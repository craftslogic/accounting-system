import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { z } from 'zod'

const TransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.coerce.number().positive('Amount must be positive'),
  category_id: z.string().uuid().optional().nullable(),
  from_account_id: z.string().uuid().optional().nullable(),
  to_account_id: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1, 'Date is required'),
}).refine((data) => {
  if (data.type === 'income' && !data.to_account_id) return false
  if (data.type === 'expense' && !data.from_account_id) return false
  if (data.type === 'transfer' && (!data.from_account_id || !data.to_account_id)) return false
  if (data.type === 'transfer' && data.from_account_id === data.to_account_id) return false
  return true
}, {
  message: 'Invalid account selection for transaction type',
})

export async function GET(req: Request) {
  try {
    const supabase = createApiClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*), from_account:accounts!from_account_id(*), to_account:accounts!to_account_id(*)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createApiClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = TransactionSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
