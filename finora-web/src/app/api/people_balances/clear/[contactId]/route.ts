import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params
    const supabase = createApiClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body for customAmount (optional)
    let customAmount: number | undefined
    try {
      const body = await req.json()
      if (body.customAmount !== undefined) {
        customAmount = Number(body.customAmount)
      }
    } catch {
      // Body might be empty
    }

    const { data: balances } = await supabase
      .from('people_balances')
      .select('type, amount')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)

    let totalPayable = 0
    let totalReceivable = 0
    for (const bal of balances || []) {
      const amt = parseFloat(String(bal.amount))
      if (bal.type === 'payable') totalPayable += amt
      if (bal.type === 'receivable') totalReceivable += amt
    }

    const net = totalReceivable - totalPayable
    if (net === 0) {
      return NextResponse.json({ message: 'Balance is already zero' })
    }

    const type = net > 0 ? 'payable' : 'receivable'
    const fullOutstanding = Math.abs(net)
    const amount = customAmount !== undefined ? customAmount : fullOutstanding

    if (amount <= 0) {
      return NextResponse.json({ error: 'Settle amount must be greater than zero' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('people_balances')
      .insert({
        contact_id: contactId,
        user_id: user.id,
        type,
        amount,
        note: customAmount !== undefined ? `Settled balance installment of ${amount}` : 'Settled balance manually',
        transaction_date: new Date().toISOString().split('T')[0]
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Balance cleared successfully' }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
