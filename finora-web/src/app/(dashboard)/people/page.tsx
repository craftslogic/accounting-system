import { createClient } from '@/lib/supabase/server'
import { PeopleClient } from './PeopleClient'
import { calculateOutstanding } from '@/utils/people'
import type { ContactWithBalance, PeopleBalanceWithContact } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'People Balances — Finoraa' }

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch contacts
  const { data: contactsData } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  // Fetch all people balance rows (opening entries + live transactions)
  const { data: balancesData } = await supabase
    .from('people_balances')
    .select('*, contact:contacts(*)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  // Fetch accounts for the "which account" step in the form
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('id, name, type')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('name', { ascending: true })

  const contacts = contactsData ?? []
  const balances = (balancesData ?? []) as PeopleBalanceWithContact[]
  const accounts = accountsData ?? []

  // Group balance rows by contact
  const balancesByContact: Record<string, typeof balances> = {}
  for (const b of balances) {
    if (!balancesByContact[b.contact_id]) balancesByContact[b.contact_id] = []
    balancesByContact[b.contact_id].push(b)
  }

  // Compute per-contact outstanding using the proper formula
  const contactsWithBalance: ContactWithBalance[] = contacts.map((c) => {
    const rows = balancesByContact[c.id] ?? []

    const outstanding_payable = calculateOutstanding(rows, 'payable')
    const outstanding_receivable = calculateOutstanding(rows, 'receivable')

    // total_payable / total_receivable = gross (for display)
    let total_payable = 0
    let total_receivable = 0
    for (const b of rows) {
      const amt = typeof b.amount === 'string' ? parseFloat(b.amount) : (b.amount || 0)
      if (isNaN(amt)) continue;
      if (b.type === 'payable' || b.type === 'opening_payable') total_payable += amt
      else if (b.type === 'receivable' || b.type === 'opening_receivable') total_receivable += amt
    }

    // net balance: positive = they owe me, negative = I owe them
    const balance = outstanding_receivable - outstanding_payable

    return {
      ...c,
      balance,
      total_payable,
      total_receivable,
      outstanding_payable,
      outstanding_receivable,
    }
  })

  return (
    <PeopleClient
      contacts={contactsWithBalance}
      transactions={balances}
      accounts={accounts}
    />
  )
}
