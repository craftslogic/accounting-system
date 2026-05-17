import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

export async function GET(req: Request) {
  try {
    const supabase = createApiClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') as 'weekly' | 'monthly' | 'yearly' || 'monthly'

    const end = new Date()
    const start = new Date()
    
    if (period === 'weekly') {
      start.setDate(end.getDate() - 7)
    } else if (period === 'monthly') {
      start.setMonth(end.getMonth() - 1)
    } else if (period === 'yearly') {
      start.setFullYear(end.getFullYear() - 1)
    }

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const { data: dailyData, error: dailyError } = await supabase.rpc('get_daily_net_worth', {
      p_user_id: user.id,
      p_start_date: startStr,
      p_end_date: endStr,
    })

    if (dailyError) {
      return NextResponse.json({ error: dailyError.message }, { status: 400 })
    }

    let totalIncome = 0
    let totalExpense = 0

    const trends = (dailyData ?? []).map((day: any) => {
      totalIncome += Number(day.income)
      totalExpense += Number(day.expense)
      return {
        date: new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: Number(day.income),
        expense: Number(day.expense),
        savings: Number(day.income) - Number(day.expense)
      }
    })

    const totalSavings = totalIncome - totalExpense

    const { data: categoryExpenses } = await supabase
      .from('transactions')
      .select(`
        amount,
        category:categories(id, name, color, icon)
      `)
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('transaction_date', startStr)
      .lte('transaction_date', endStr)
      .not('category_id', 'is', null)

    const catMap: Record<string, { name: string; color: string; icon: string; amount: number }> = {}
    for (const tx of categoryExpenses ?? []) {
      const cat = (Array.isArray(tx.category) ? tx.category[0] : tx.category) as { id: string; name: string; color: string; icon: string } | null
      if (!cat) continue
      if (!catMap[cat.name]) {
        catMap[cat.name] = { name: cat.name, color: cat.color, icon: cat.icon, amount: 0 }
      }
      catMap[cat.name].amount += parseFloat(String(tx.amount))
    }
    const categoryBreakdown = Object.values(catMap).sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      data: {
        trends,
        totalIncome,
        totalExpense,
        totalSavings,
        categoryBreakdown
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
