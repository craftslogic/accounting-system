'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAnalyticsData(period: 'weekly' | 'monthly' | 'yearly') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  // Calculate dates based on period
  const end = new Date()
  const start = new Date()
  
  if (period === 'weekly') {
    start.setDate(end.getDate() - 7)
  } else if (period === 'monthly') {
    start.setMonth(end.getMonth() - 1)
  } else if (period === 'yearly') {
    start.setFullYear(end.getFullYear() - 1)
  }

  // 1. Get daily net worth history from the RPC
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  const { data: dailyData, error: dailyError } = await supabase.rpc('get_daily_net_worth', {
    p_user_id: user.id,
    p_start_date: startStr,
    p_end_date: endStr,
  })

  if (dailyError) {
    console.error('Error fetching daily net worth:', dailyError)
  }

  // 1.5 Get people transactions to subtract from income/expense
  const { data: peopleData } = await supabase
    .from('people_balances')
    .select('subtype, amount, transaction_date')
    .eq('user_id', user.id)
    .in('subtype', ['borrow', 'lend', 'repay', 'collect'])
    .gte('transaction_date', startStr)
    .lte('transaction_date', endStr)

  const peopleByDay: Record<string, { income: number; expense: number }> = {}
  for (const pb of peopleData ?? []) {
    const dayStr = pb.transaction_date.substring(0, 10)
    if (!peopleByDay[dayStr]) peopleByDay[dayStr] = { income: 0, expense: 0 }
    
    const amount = parseFloat(String(pb.amount))
    if (pb.subtype === 'borrow' || pb.subtype === 'collect') {
      peopleByDay[dayStr].income += amount
    } else if (pb.subtype === 'lend' || pb.subtype === 'repay') {
      peopleByDay[dayStr].expense += amount
    }
  }

  // 2. Aggregate stats
  let totalIncome = 0
  let totalExpense = 0

  const trends = (dailyData ?? []).map((day: any) => {
    const dayStr = String(day.day).substring(0, 10)
    const pData = peopleByDay[dayStr] ?? { income: 0, expense: 0 }
    
    const trueIncome = Number(day.income) - pData.income
    const trueExpense = Number(day.expense) - pData.expense
    
    totalIncome += trueIncome
    totalExpense += trueExpense
    
    return {
      date: new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income: trueIncome,
      expense: trueExpense,
      savings: trueIncome - trueExpense
    }
  })

  const totalSavings = totalIncome - totalExpense

  // 3. Category Breakdown
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

  return {
    trends,
    totalIncome,
    totalExpense,
    totalSavings,
    categoryBreakdown
  }
}
