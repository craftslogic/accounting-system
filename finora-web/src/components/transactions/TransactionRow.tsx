import { formatCurrency, getAmountColor } from '@/utils/currency'
import { formatDate } from '@/utils/dates'
import { cn } from '@/lib/utils'
import type { TransactionWithDetails } from '@/types'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'

const typeIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
}

const typeBgColors = {
  income: 'bg-emerald-500/10 text-emerald-400',
  expense: 'bg-red-500/10 text-red-400',
  transfer: 'bg-blue-500/10 text-blue-400',
}

interface TransactionRowProps {
  transaction: TransactionWithDetails
  actions?: React.ReactNode
}

/**
 * A single transaction row showing type icon, description, amount, and date.
 */
export function TransactionRow({ transaction, actions }: TransactionRowProps) {
  const Icon = typeIcons[transaction.type]
  const colorClass = getAmountColor(transaction.type)
  const bgClass = typeBgColors[transaction.type]
  
  // Determine display amount with sign
  const displayAmount = transaction.type === 'income'
    ? `+${formatCurrency(transaction.amount, transaction.to_account?.currency)}`
    : transaction.type === 'expense'
    ? `-${formatCurrency(transaction.amount, transaction.from_account?.currency)}`
    : formatCurrency(transaction.amount, transaction.from_account?.currency)

  const accountLabel =
    transaction.type === 'transfer'
      ? `${transaction.from_account?.name} → ${transaction.to_account?.name}`
      : transaction.type === 'income'
      ? transaction.to_account?.name
      : transaction.from_account?.name

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-accent/50 transition-colors group">
      {/* Icon */}
      <div className={cn('p-2.5 rounded-xl shrink-0', bgClass)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {transaction.category && (
            <span
              className="text-sm shrink-0"
              title={transaction.category.name}
            >
              {transaction.category.icon}
            </span>
          )}
          <p className="text-sm font-medium text-foreground truncate">
            {transaction.note || transaction.category?.name || `${transaction.type} transaction`}
          </p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{accountLabel}</p>
      </div>

      {/* Date */}
      <p className="text-xs text-muted-foreground hidden sm:block shrink-0">
        {formatDate(transaction.transaction_date)}
      </p>

      {/* Amount */}
      <p className={cn('text-sm font-semibold shrink-0', colorClass)}>
        {displayAmount}
      </p>

      {/* Actions */}
      {actions && (
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  )
}
