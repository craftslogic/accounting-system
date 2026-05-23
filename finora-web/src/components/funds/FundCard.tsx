import Link from 'next/link'
import { TrendingUp, Target, Archive } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import type { FundWithStats } from '@/types'

interface FundCardProps {
  fund: FundWithStats
}

export function FundCard({ fund }: FundCardProps) {
  const hasGoal = fund.target_amount !== null && fund.target_amount > 0
  const progress = fund.progress_percentage ?? 0
  const isComplete = hasGoal && progress >= 100

  return (
    <Link
      href={`/funds/${fund.id}`}
      className="block group relative rounded-2xl border border-white/10 bg-card hover:border-white/20 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
    >
      {/* Color accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: fund.color }}
      />

      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 opacity-5 rounded-2xl"
        style={{ background: `radial-gradient(circle at top right, ${fund.color}, transparent 70%)` }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
              style={{ backgroundColor: `${fund.color}20`, border: `1px solid ${fund.color}30` }}
            >
              {fund.icon}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {fund.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{fund.type}</p>
            </div>
          </div>
          {isComplete && (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              <Target className="w-3 h-3" />
              Done!
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <p className="text-xl font-bold" style={{ color: fund.color }}>
            {formatCurrency(fund.current_amount)}
          </p>
          {hasGoal && (
            <p className="text-xs text-muted-foreground mt-0.5">
              of{' '}
              <span className="font-medium text-foreground/70">
                {formatCurrency(fund.target_amount!)}
              </span>{' '}
              goal
            </p>
          )}
        </div>

        {/* Progress bar */}
        {hasGoal && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold" style={{ color: fund.color }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, progress)}%`,
                  backgroundColor: fund.color,
                  boxShadow: `0 0 8px ${fund.color}60`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {hasGoal ? (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">
                {formatCurrency(fund.remaining_amount ?? 0)}
              </span>{' '}
              remaining
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              No goal set
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Set aside
          </div>
        </div>
      </div>
    </Link>
  )
}
