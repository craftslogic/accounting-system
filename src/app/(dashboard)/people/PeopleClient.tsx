'use client'

import { useState } from 'react'
import { Plus, Users, ArrowDownRight, ArrowUpRight, Search, ArrowLeftRight } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { ContactWithBalance, PeopleBalanceWithContact } from '@/types'

interface PeopleClientProps {
  contacts: ContactWithBalance[]
  transactions: PeopleBalanceWithContact[]
}

export function PeopleClient({ contacts, transactions }: PeopleClientProps) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'contacts' | 'transactions'>('contacts')
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalPayable = contacts.reduce((sum, c) => sum + c.total_payable, 0)
  const totalReceivable = contacts.reduce((sum, c) => sum + c.total_receivable, 0)
  const netBalance = totalReceivable - totalPayable

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            People Balances
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track money you lent to or borrowed from others.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" /> Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Person</DialogTitle>
              </DialogHeader>
              <ContactForm onSuccess={() => setContactDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto gradient-primary border-0 text-white">
                <ArrowLeftRight className="w-4 h-4 mr-2" /> Record Balance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Balance</DialogTitle>
              </DialogHeader>
              <BalanceForm contacts={contacts} onSuccess={() => setBalanceDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <ArrowDownRight className="w-5 h-5" />
            <span className="font-medium text-sm">I Owe (Payable)</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalPayable)}</p>
        </div>
        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <span className="font-medium text-sm">Owed To Me (Receivable)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalReceivable)}</p>
        </div>
        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Net Balance</span>
          </div>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
            {formatCurrency(Math.abs(netBalance))} {netBalance < 0 ? '(I Owe)' : '(Owed to Me)'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 glass rounded-lg w-fit border border-white/10">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'contacts' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          People Overview
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'transactions' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Transaction History
        </button>
      </div>

      {/* Content */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
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
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">I Owe Them</th>
                    <th className="px-4 py-3 text-right">They Owe Me</th>
                    <th className="px-4 py-3 text-right">Net Status</th>
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
                    filteredContacts.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-medium">{c.name}</td>
                        <td className="px-4 py-4 capitalize text-muted-foreground">{c.type}</td>
                        <td className="px-4 py-4 text-right text-orange-400">
                          {c.total_payable > 0 ? formatCurrency(c.total_payable) : '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-emerald-400">
                          {c.total_receivable > 0 ? formatCurrency(c.total_receivable) : '-'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            c.balance > 0 ? 'bg-emerald-500/10 text-emerald-400' :
                            c.balance < 0 ? 'bg-orange-500/10 text-orange-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {c.balance === 0 ? 'Settled' : formatCurrency(Math.abs(c.balance))}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No transaction history found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(t.transaction_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4 font-medium">{t.contact?.name}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === 'receivable' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {t.type === 'receivable' ? 'They Owe Me' : 'I Owe Them'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground max-w-[200px] truncate">
                        {t.note || '-'}
                      </td>
                      <td className={`px-4 py-4 text-right font-medium ${
                        t.type === 'receivable' ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
