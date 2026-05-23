'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ArrowUpFromLine, ArrowDownToLine, Settings2,
  Archive, ArchiveX, Trash2, Calendar, Wallet,
  TrendingUp, ChevronLeft,
} from 'lucide-react'
import { FundTransactionForm } from './FundTransactionForm'
import { FundForm } from './FundForm'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/currency'
import { toggleArchiveFundAction, deleteFundAction, deleteFundTransactionAction } from '@/actions/funds'
import type { FundWithStats, Account } from '@/types'
import Link from 'next/link'

interface FundTransaction {
  id: string
  type: 'allocate' | 'withdraw' | 'adjustment'
  amount: number
  note: string | null
  transaction_date: string
  created_at: string
  account?: { id: string; name: string; type: string } | null
}

interface FundDetailClientProps {
  fund: FundWithStats
  transactions: FundTransaction[]
  accounts: Account[]
}

type ActivePanel = null | 'allocate' | 'withdraw' | 'adjustment' | 'edit' | 'recurring'

const TX_ICONS: Record<string, string> = {
  allocate: '➕',
  withdraw: '💸',
  adjustment: '🔧',
}

const TX_COLORS: Record<string, string> = {
  allocate: 'text-emerald-400',
  withdraw: 'text-orange-400',
  adjustment: 'text-blue-400',
}

export function FundDetailClient({ fund, transactions, accounts }: FundDetailClientProps) {
  const router = useRouter()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const progress = fund.progress_percentage ?? 0
  const hasGoal = fund.target_amount !== null && fund.target_amount !== undefined
  const isComplete = hasGoal && progress >= 100

  async function handleArchive() {
    await toggleArchiveFundAction(fund.id, !fund.is_archived)
    router.push('/funds')
  }

  async function handleDelete() {
    if (!confirm(`Delete "${fund.name}"? This will remove all its transaction history too.`)) return
    setIsDeleting(true)
    await deleteFundAction(fund.id)
    router.push('/funds')
  }

  async function handleDeleteTx(txId: string) {
    if (!confirm('Remove this transaction? The fund balance will be reversed.')) return
    await deleteFundTransactionAction(txId, fund.id)
    router.refresh()
  }

  const closePanel = () => setActivePanel(null)

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Back */}
      <div>
        <Link
          href="/funds"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          All Funds
        </Link>

        {/* Fund header card */}
        <div
          className="rounded-2xl border p-6 relative overflow-hidden"
          style={{
            borderColor: `${fund.color}30`,
            background: `linear-gradient(135deg, ${fund.color}15 0%, transparent 60%)`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: fund.color }}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2"
                style={{
                  backgroundColor: `${fund.color}20`,
                  borderColor: `${fund.color}40`,
                  boxShadow: `0 4px 24px ${fund.color}30`,
                }}
              >
                {fund.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{fund.name}</h1>
                  {isComplete && (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                      ✅ Goal Reached!
                    </span>
                  )}
                  {fund.is_archived && (
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground capitalize mt-0.5">{fund.type}</p>
                {fund.description && (
                  <p className="text-sm text-muted-foreground mt-1">{fund.description}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {!fund.is_archived && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setActivePanel('allocate')}
                    className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Money
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActivePanel('withdraw')}
                    className="bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/20"
                  >
                    <ArrowUpFromLine className="w-4 h-4 mr-1.5" />
                    Use Money
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActivePanel('edit')}
                className="text-muted-foreground"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleArchive}
                className="text-muted-foreground"
                title={fund.is_archived ? 'Unarchive' : 'Archive'}
              >
                {fund.is_archived ? <ArchiveX className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Balance + goal progress */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reserved</p>
              <p className="text-2xl font-bold" style={{ color: fund.color }}>
                {formatCurrency(fund.current_amount)}
              </p>
            </div>
            {hasGoal && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Goal</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(fund.target_amount!)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-foreground/70">
                    {formatCurrency(fund.remaining_amount ?? 0)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Progress bar */}
          {hasGoal && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Goal Progress</span>
                <span className="text-sm font-semibold" style={{ color: fund.color }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, progress)}%`,
                    backgroundColor: fund.color,
                    boxShadow: `0 0 12px ${fund.color}60`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel: Transaction forms / Edit form */}
      {activePanel && (
        <div className="rounded-2xl border border-white/10 bg-card p-6 animate-slide-up">
          <h3 className="font-semibold mb-4">
            {activePanel === 'allocate' && '➕ Add Money to Fund'}
            {activePanel === 'withdraw' && '💸 Use Money from Fund'}
            {activePanel === 'adjustment' && '🔧 Adjust Fund Balance'}
            {activePanel === 'edit' && '✏️ Edit Fund'}
          </h3>
          {(activePanel === 'allocate' || activePanel === 'withdraw' || activePanel === 'adjustment') && (
            <FundTransactionForm
              fundId={fund.id}
              fundName={fund.name}
              fundColor={fund.color}
              defaultType={activePanel}
              accounts={accounts}
              onSuccess={() => { closePanel(); router.refresh() }}
              onCancel={closePanel}
            />
          )}
          {activePanel === 'edit' && (
            <FundForm
              fund={fund}
              onSuccess={() => { closePanel(); router.refresh() }}
              onCancel={closePanel}
            />
          )}
        </div>
      )}

      {/* Stats mini cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Total Added</p>
          </div>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(fund.total_allocated)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpFromLine className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-muted-foreground">Total Used</p>
          </div>
          <p className="text-lg font-bold text-orange-400">
            {formatCurrency(fund.total_withdrawn)}
          </p>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          {!fund.is_archived && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActivePanel('adjustment')}
              className="text-muted-foreground text-xs gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Adjust
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
              {!fund.is_archived && (
                <p className="text-muted-foreground text-xs mt-1">
                  Add money to see your history here.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 group hover:bg-white/2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center text-base shrink-0">
                    {TX_ICONS[tx.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">
                      {tx.type === 'allocate' ? 'Added money' :
                       tx.type === 'withdraw' ? 'Used money' : 'Balance adjusted'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(tx.transaction_date).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      {tx.account && (
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {tx.account.name}
                        </span>
                      )}
                      {tx.note && <span>· {tx.note}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${TX_COLORS[tx.type]}`}>
                      {tx.type === 'allocate' ? '+' : tx.type === 'withdraw' ? '-' : ''}
                      {formatCurrency(parseFloat(String(tx.amount)))}
                    </span>
                    <button
                      onClick={() => handleDeleteTx(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
