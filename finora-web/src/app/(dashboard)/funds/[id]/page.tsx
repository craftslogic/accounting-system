import { notFound } from 'next/navigation'
import { getFundById, getFundTransactions } from '@/actions/funds'
import { getAccounts } from '@/actions/accounts'
import { FundDetailClient } from '@/components/funds/FundDetailClient'
import type { Metadata } from 'next'
import type { Account } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const fund = await getFundById(id)
  return { title: fund ? `${fund.icon} ${fund.name} — Finora` : 'Fund Not Found' }
}

export default async function FundDetailPage({ params }: PageProps) {
  const { id } = await params

  const [fund, transactions, accounts] = await Promise.all([
    getFundById(id),
    getFundTransactions(id),
    getAccounts(),
  ])

  if (!fund) notFound()

  return (
    <FundDetailClient
      fund={fund}
      transactions={transactions as Parameters<typeof FundDetailClient>[0]['transactions']}
      accounts={accounts as Account[]}
    />
  )
}
