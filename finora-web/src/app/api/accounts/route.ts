import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

export async function GET(req: Request) {
  try {
    const supabase = createApiClient(req)
    
    // Authenticate the user based on the Bearer token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('name')

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
    const { name, type, currency, initial_balance } = body

    if (!name || !type || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: account, error: insertError } = await supabase
      .from('accounts')
      .insert({
        name,
        type,
        currency,
        user_id: user.id
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Handle initial balance transaction if provided
    if (initial_balance && Number(initial_balance) > 0) {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'income',
        amount: Number(initial_balance),
        to_account_id: account.id,
        note: 'Initial Balance',
        transaction_date: new Date().toISOString()
      })
    }

    return NextResponse.json({ data: account }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
