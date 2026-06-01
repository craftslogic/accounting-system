'use client'

import { useState } from 'react'
import {
  Plus, Users, ArrowDownRight, ArrowUpRight, Search,
  ArrowLeftRight, Trash2, Edit, HandCoins, History,
  AlertTriangle, ChevronRight, CheckCircle2, TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  clearContactBalanceAction,
  deletePeopleBalanceAction,
  writeOffBalanceAction,
} from '@/actions/people'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ContactForm } from '@/components/people/ContactForm'
import { BalanceForm } from '@/components/people/BalanceForm'
import type { ContactWithBalance, PeopleBalanceWithContact, PeopleBalance } from '@/types'

interface SimpleAccount {
  id: string
  name: string
  type: string
}

interface PeopleClientProps {
  contacts: ContactWithBalance[]
  transactions: PeopleBalanceWithContact[]
  accounts: SimpleAccount[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function subtypeLabel(type: string, subtype: string | null): string {
  if (type === 'opening_payable') return 'Opening Payable'
  if (type === 'opening_receivable') return 'Opening Receivable'
  switch (subtype) {
    case 'borrow': return 'Borrowed'
    case 'lend': return 'Lent'
    case 'repay': return 'Repaid'
    case 'collect': return 'Collected'
    case 'adjustment': return 'Adjustment'
    case 'writeoff': return 'Written Off'
    default: return type
  }
}

function subtypeColor(type: string, subtype: string | null): string {
  if (type === 'opening_payable') return 'bg-orange-500/10 text-orange-400'
  if (type === 'opening_receivable') return 'bg-emerald-500/10 text-emerald-400'
  switch (subtype) {
    case 'borrow': return 'bg-orange-500/10 text-orange-400'
    case 'lend': return 'bg-emerald-500/10 text-emerald-400'
    case 'repay': return 'bg-blue-500/10 text-blue-400'
    case 'collect': return 'bg-teal-500/10 text-teal-400'
    case 'writeoff': return 'bg-gray-500/10 text-gray-400'
    case 'adjustment': return 'bg-purple-500/10 text-purple-400'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PeopleClient({ contacts, transactions, accounts }: PeopleClientProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'contacts' | 'transactions'>('contacts')
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)

  // Per-person action dialogs
  const [selectedContact, setSelectedContact] = useState<ContactWithBalance | null>(null)
  const [repayDialogOpen, setRepayDialogOpen] = useState(false)
  const [collectDialogOpen, setCollectDialogOpen] = useState(false)
  const [writeoffDialogOpen, setWriteoffDialogOpen] = useState(false)
  const [writeoffDirection, setWriteoffDirection] = useState<'payable' | 'receivable'>('payable')
  const [writeoffNote, setWriteoffNote] = useState('')

  const [editingBalance, setEditingBalance] = useState<PeopleBalance | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isWritingOff, setIsWritingOff] = useState(false)

  // ── Calculations ────────────────────────────────────────────────────────────
  const totalOutstandingPayable = contacts.reduce((s, c) => s + c.outstanding_payable, 0)
  const totalOutstandingReceivable = contacts.reduce((s, c) => s + c.outstanding_receivable, 0)
  const netBalance = totalOutstandingReceivable - totalOutstandingPayable

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleDeleteTransaction(id: string) {
    if (!confirm('Delete this record? This cannot be undone.')) return
    setIsDeleting(id)
    const result = await deletePeopleBalanceAction(id)
    if (result.success) {
      toast({ title: 'Record deleted', variant: 'success' })
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    }
    setIsDeleting(null)
  }

  async function handleWriteOff() {
    if (!selectedContact) return
    const amount =
      writeoffDirection === 'payable'
        ? selectedContact.outstanding_payable
        : selectedContact.outstanding_receivable

    if (amount <= 0) {
      toast({ title: 'Nothing to write off', variant: 'destructive' })
      return
    }

    setIsWritingOff(true)
    const res = await writeOffBalanceAction(
      selectedContact.id,
      writeoffDirection,
      amount,
      writeoffNote || null
    )
    setIsWritingOff(false)

    if (res.success) {
      toast({ title: 'Balance written off / settled', variant: 'success' })
      setWriteoffDialogOpen(false)
      setSelectedContact(null)
      setWriteoffNote('')
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            People Balances
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track money you owe to others or others owe to you.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Add Person */}
          <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" /> Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Person</DialogTitle></DialogHeader>
              <ContactForm onSuccess={() => setContactDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Record Balance */}
          <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto gradient-primary border-0 text-white">
                <ArrowLeftRight className="w-4 h-4 mr-2" /> Record Balance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record People Balance</DialogTitle></DialogHeader>
              <BalanceForm
                contacts={contacts}
                accounts={accounts}
                onSuccess={() => setBalanceDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <ArrowDownRight className="w-5 h-5" />
            <span className="font-medium text-sm">I Need To Pay (Total)</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalOutstandingPayable)}</p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding across all people</p>
        </div>

        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <span className="font-medium text-sm">They Need To Pay Me (Total)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalOutstandingReceivable)}</p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding across all people</p>
        </div>

        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Net People Balance</span>
          </div>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
            {formatCurrency(Math.abs(netBalance))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {netBalance > 0 ? 'Net: others owe you more' : netBalance < 0 ? 'Net: you owe more' : 'Balanced'}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 p-1 glass rounded-lg w-fit border border-white/10">
        {(['contacts', 'transactions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'contacts' ? 'People Overview' : 'Transaction History'}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">

        {/* ── People Overview ── */}
        {activeTab === 'contacts' ? (
          <div className="p-4">
            <div className="relative max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3 text-right">I Owe Them</th>
                    <th className="px-4 py-3 text-right">They Owe Me</th>
                    <th className="px-4 py-3 text-right">Net Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No people found. Add your first contact above.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => {
                      const isSettled = c.outstanding_payable === 0 && c.outstanding_receivable === 0
                      return (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right">
                            {c.outstanding_payable > 0 ? (
                              <div>
                                <p className="text-orange-400 font-semibold">{formatCurrency(c.outstanding_payable)}</p>
                                <p className="text-xs text-muted-foreground">I need to pay</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {c.outstanding_receivable > 0 ? (
                              <div>
                                <p className="text-emerald-400 font-semibold">{formatCurrency(c.outstanding_receivable)}</p>
                                <p className="text-xs text-muted-foreground">They need to pay</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {isSettled ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                                ✓ Settled
                              </span>
                            ) : c.balance > 0 ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                                {formatCurrency(c.outstanding_receivable)} incoming
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400">
                                <TrendingDown className="w-3 h-3 inline mr-1" />
                                {formatCurrency(c.outstanding_payable)} outgoing
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Record repayment */}
                              {c.outstanding_payable > 0 && (
                                <Dialog
                                  open={repayDialogOpen && selectedContact?.id === c.id}
                                  onOpenChange={(o) => {
                                    setRepayDialogOpen(o)
                                    if (o) setSelectedContact(c)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 text-xs"
                                      title="Record payment to them"
                                    >
                                      <HandCoins className="w-3.5 h-3.5 mr-1" /> Pay
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Record Payment to {c.name}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4">
                                      <p className="text-sm text-orange-400">
                                        Outstanding: <span className="font-bold">{formatCurrency(c.outstanding_payable)}</span>
                                      </p>
                                    </div>
                                    <BalanceForm
                                      contacts={contacts}
                                      accounts={accounts}
                                      preSelectedContactId={c.id}
                                      preSelectedSubtype="repay"
                                      onSuccess={() => {
                                        setRepayDialogOpen(false)
                                        setSelectedContact(null)
                                      }}
                                    />
                                  </DialogContent>
                                </Dialog>
                              )}

                              {/* Collect repayment */}
                              {c.outstanding_receivable > 0 && (
                                <Dialog
                                  open={collectDialogOpen && selectedContact?.id === c.id}
                                  onOpenChange={(o) => {
                                    setCollectDialogOpen(o)
                                    if (o) setSelectedContact(c)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                      title="Receive payment from them"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5 mr-1" /> Collect
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Collect Payment from {c.name}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                      <p className="text-sm text-emerald-400">
                                        Outstanding: <span className="font-bold">{formatCurrency(c.outstanding_receivable)}</span>
                                      </p>
                                    </div>
                                    <BalanceForm
                                      contacts={contacts}
                                      accounts={accounts}
                                      preSelectedContactId={c.id}
                                      preSelectedSubtype="collect"
                                      onSuccess={() => {
                                        setCollectDialogOpen(false)
                                        setSelectedContact(null)
                                      }}
                                    />
                                  </DialogContent>
                                </Dialog>
                              )}

                              {/* Write off */}
                              {!isSettled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContact(c)
                                    setWriteoffDirection(c.outstanding_payable > 0 ? 'payable' : 'receivable')
                                    setWriteoffDialogOpen(true)
                                  }}
                                  className="h-8 px-2 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 text-xs"
                                  title="Write off / Forgive debt"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Transaction History ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No transaction history found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const isInflow = t.type === 'opening_receivable' ||
                      t.subtype === 'lend' || t.subtype === 'collect'
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {format(new Date(t.transaction_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-4 font-medium">{t.contact?.name}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${subtypeColor(t.type, t.subtype)}`}>
                            {subtypeLabel(t.type, t.subtype)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground max-w-[200px] truncate">
                          {t.note || '—'}
                        </td>
                        <td className={`px-4 py-4 text-right font-semibold ${isInflow ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {isInflow ? '+' : '−'}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingBalance(t)}
                              disabled={isDeleting === t.id}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTransaction(t.id)}
                              disabled={isDeleting === t.id}
                              className="h-8 w-8 text-muted-foreground hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Write-Off Dialog ── */}
      <Dialog open={writeoffDialogOpen} onOpenChange={setWriteoffDialogOpen}>
        <DialogContent className="glass border border-white/10 text-foreground max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Write Off / Forgive Debt
            </DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4 pt-2">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-400">
                  This will mark the outstanding balance as forgiven/settled.
                  The history will be kept for auditing purposes.
                </p>
              </div>

              {selectedContact.outstanding_payable > 0 && selectedContact.outstanding_receivable > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Which balance to write off?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWriteoffDirection('payable')}
                      className={`p-3 rounded-xl border text-xs transition-all ${writeoffDirection === 'payable' ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 bg-white/5'}`}
                    >
                      <p className="font-semibold text-orange-400">I owe them</p>
                      <p className="text-muted-foreground">{formatCurrency(selectedContact.outstanding_payable)}</p>
                    </button>
                    <button
                      onClick={() => setWriteoffDirection('receivable')}
                      className={`p-3 rounded-xl border text-xs transition-all ${writeoffDirection === 'receivable' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
                    >
                      <p className="font-semibold text-emerald-400">They owe me</p>
                      <p className="text-muted-foreground">{formatCurrency(selectedContact.outstanding_receivable)}</p>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-sm text-muted-foreground">
                  {writeoffDirection === 'payable' ? 'Writing off your payable to' : 'Writing off receivable from'}:
                </p>
                <p className="text-base font-semibold mt-1">{selectedContact.name}</p>
                <p className={`font-bold text-xl mt-1 ${writeoffDirection === 'payable' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {formatCurrency(
                    writeoffDirection === 'payable'
                      ? selectedContact.outstanding_payable
                      : selectedContact.outstanding_receivable
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Note (optional)</label>
                <Input
                  value={writeoffNote}
                  onChange={(e) => setWriteoffNote(e.target.value)}
                  placeholder="e.g. Forgiven as a gift, mutual agreement..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => { setWriteoffDialogOpen(false); setSelectedContact(null) }}
                  disabled={isWritingOff}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWriteOff}
                  disabled={isWritingOff}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                >
                  {isWritingOff ? 'Processing...' : 'Write Off'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Balance Dialog ── */}
      <Dialog open={!!editingBalance} onOpenChange={(open) => !open && setEditingBalance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Record</DialogTitle></DialogHeader>
          {editingBalance && (
            <BalanceForm
              contacts={contacts}
              accounts={accounts}
              initialData={editingBalance}
              onSuccess={() => setEditingBalance(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
