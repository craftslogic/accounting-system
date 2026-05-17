import { formatCurrency } from '@/utils/currency'
import { cn } from '@/lib/utils'
import type { AccountWithBalance } from '@/types'
import { CreditCard, Landmark, Wallet, PiggyBank, Archive } from 'lucide-react'

const accountTypeIcons: Record<string, React.ElementType> = {
  cash: Wallet,
  bank: Landmark,
  wallet: CreditCard,
  savings: PiggyBank,
  custom: CreditCard,
}

const accountTypeColors: Record<string, string> = {
  cash: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  bank: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  wallet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
  savings: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  custom: 'from-pink-500/20 to-pink-500/5 border-pink-500/30',
}

interface AccountCardProps {
  account: AccountWithBalance
  onClick?: () => void
  actions?: React.ReactNode
}

/**
 * Reusable account card that displays balance and account type.
 * Balance is always computed dynamically — never stored.
 */
export function AccountCard({ account, onClick, actions }: AccountCardProps) {
  const Icon = accountTypeIcons[account.type] || CreditCard
  const gradientClass = accountTypeColors[account.type] || accountTypeColors.custom
  const isNegative = account.balance < 0

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-gradient-to-br p-5 transition-all duration-200',
        gradientClass,
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
        account.is_archived && 'opacity-60'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Archive badge */}
      {account.is_archived && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
          <Archive className="w-3 h-3" />
          Archived
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/10">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{account.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
          </div>
        </div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
        <p className={cn(
          'text-2xl font-bold',
          isNegative ? 'text-red-400' : 'text-foreground'
        )}>
          {formatCurrency(account.balance, account.currency)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{account.currency}</p>
      </div>
    </div>
  )
}
