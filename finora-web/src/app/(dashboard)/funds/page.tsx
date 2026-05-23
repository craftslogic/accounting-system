import { createClient } from '@/lib/supabase/server'
import { FundsClient } from '@/components/funds/FundsClient'
import { getFunds, getFundDashboardStats } from '@/actions/funds'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Funds — Finora' }

export default async function FundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [funds, stats] = await Promise.all([
    getFunds(),
    getFundDashboardStats(),
  ])

  return (
    <FundsClient
      funds={funds}
      totalReserved={stats.totalReserved}
      monthlyAllocations={stats.monthlyAllocations}
    />
  )
}
