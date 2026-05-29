import { createClient } from '@/lib/supabase/server'
import { PeopleClient } from './PeopleClient'
import type { ContactWithBalance, PeopleBalanceWithContact } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'People Balances' }

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

  // Fetch balances
  const { data: balancesData } = await supabase
    .from('people_balances')
    .select('*, contact:contacts(*)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  const contacts = contactsData as ContactWithBalance[] | null ?? []
  const balances = balancesData as PeopleBalanceWithContact[] | null ?? []

  // Combine logic
  const contactMap: Record<string, ContactWithBalance> = {}
  for (const c of contacts) {
    contactMap[c.id] = { ...c, balance: 0, total_payable: 0, total_receivable: 0 }
  }

  for (const b of balances) {
    const cid = b.contact_id
    if (contactMap[cid]) {
      const amount = parseFloat(String(b.amount))
      if (b.type === 'payable' || b.type === 'opening_payable') {
        contactMap[cid].total_payable += amount
      } else if (b.type === 'receivable' || b.type === 'opening_receivable') {
        contactMap[cid].total_receivable += amount
      }
    }
  }

  for (const cid in contactMap) {
    const c = contactMap[cid]
    // balance is what THEY owe me (receivable) minus what I owe THEM (payable)
    c.balance = c.total_receivable - c.total_payable
  }

  return (
    <PeopleClient 
      contacts={Object.values(contactMap)} 
      transactions={balances} 
    />
  )
}
