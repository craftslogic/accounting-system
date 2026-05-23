'use client'

import { useState } from 'react'
import { Plus, PiggyBank, Archive, ArchiveX } from 'lucide-react'
import { FundCard } from './FundCard'
import { FundForm } from './FundForm'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/currency'
import type { FundWithStats } from '@/types'
import Link from 'next/link'

interface FundsClientProps {
  funds: FundWithStats[]
  totalReserved: number
  monthlyAllocations: number
}

export function FundsClient({ funds, totalReserved, monthlyAllocations }: FundsClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const activeFunds = funds.filter(f => !f.is_archived)
  const archivedFunds = funds.filter(f => f.is_archived)

  const displayedFunds = showArchived ? archivedFunds : activeFunds

  if (showCreate) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowCreate(false)}
            className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">Create a Fund</h1>
            <p className="text-sm text-muted-foreground">Reserve money for a purpose</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <FundForm
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Funds</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Money set aside for specific goals
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 gradient-primary text-white"
        >
          <Plus className="w-4 h-4" />
          New Fund
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Reserved</p>
          <p className="text-2xl font-bold text-violet-400">{formatCurrency(totalReserved)}</p>
          <p className="text-xs text-muted-foreground mt-1">Money set aside</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-5">
          <p className="text-sm text-muted-foreground mb-2">Active Funds</p>
          <p className="text-2xl font-bold text-emerald-400">{activeFunds.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Ongoing goals</p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-5">
          <p className="text-sm text-muted-foreground mb-2">This Month</p>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthlyAllocations)}</p>
          <p className="text-xs text-muted-foreground mt-1">Allocated to funds</p>
        </div>
      </div>

      {/* Tab: Active / Archived */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !showArchived
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          Active ({activeFunds.length})
        </button>
        {archivedFunds.length > 0 && (
          <button
            onClick={() => setShowArchived(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showArchived
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived ({archivedFunds.length})
          </button>
        )}
      </div>

      {/* Fund list */}
      {displayedFunds.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">
            {showArchived ? 'No archived funds' : 'No funds yet'}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {showArchived
              ? 'Archived funds will appear here'
              : 'Create your first fund to start reserving money for your goals.'}
          </p>
          {!showArchived && (
            <Button onClick={() => setShowCreate(true)} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Fund
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedFunds.map(fund => (
            <FundCard key={fund.id} fund={fund} />
          ))}
        </div>
      )}
    </div>
  )
}
