import { createClient } from '@/lib/supabase/server'
import { getAllFundsForDashboard } from '@/actions/funds'
import { formatCurrency } from '@/utils/currency'
import Link from 'next/link'
import { PiggyBank, ChevronRight, Target } from 'lucide-react'

interface Fund {
  id: string
  name: string
  icon: string
  color: string
  current_amount: number
  target_amount: number | null
}

export async function FundsDashboardWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [funds, reservedData] = await Promise.all([
    getAllFundsForDashboard(),
    supabase
      .from('funds')
      .select('current_amount')
      .eq('user_id', user.id)
      .eq('is_archived', false),
  ])

  const totalReserved = (reservedData.data ?? []).reduce(
    (sum, f) => sum + parseFloat(String(f.current_amount)), 0
  )

  if (funds.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Funds</h3>
          <Link href="/funds" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="text-center py-4">
          <PiggyBank className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No funds yet</p>
          <Link href="/funds" className="text-xs text-primary hover:underline mt-1 inline-block">
            Create your first fund →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">Funds Reserved</h3>
          <p className="text-xl font-bold text-violet-400 mt-0.5">
            {formatCurrency(totalReserved)}
          </p>
        </div>
        <Link
          href="/funds"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {funds.slice(0, 3).map(fund => {
          const progress =
            fund.target_amount && fund.target_amount > 0
              ? Math.min(100, (fund.current_amount / fund.target_amount) * 100)
              : null

          return (
            <Link
              key={fund.id}
              href={`/funds/${fund.id}`}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/50 transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: `${fund.color}20` }}
              >
                {fund.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{fund.name}</p>
                  <p className="text-sm font-semibold ml-2 shrink-0" style={{ color: fund.color }}>
                    {formatCurrency(fund.current_amount)}
                  </p>
                </div>
                {progress !== null && (
                  <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress}%`, backgroundColor: fund.color }}
                    />
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
