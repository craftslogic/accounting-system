import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

export async function GET(req: Request) {
  try {
    const supabase = createApiClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const { amount, period, category_id, account_id } = body

    if (!amount || !period) {
      return NextResponse.json({ error: 'Amount and period are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        amount: Number(amount),
        period,
        category_id: category_id === 'none' ? null : (category_id || null),
        account_id: account_id === 'none' ? null : (account_id || null)
      })
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
