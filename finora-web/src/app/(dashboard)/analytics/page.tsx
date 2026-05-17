import { Suspense } from "react";
import { getAnalyticsData } from "@/actions/analytics";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { formatCurrency } from "@/utils/currency";
import { TrendingDown, TrendingUp, PiggyBank, Calendar } from "lucide-react";

export default async function AnalyticsPage(
  props: {
    searchParams?: Promise<{ period?: string }>
  }
) {
  const searchParams = await props.searchParams
  const rawPeriod = searchParams?.period ?? "monthly"
  const period: "weekly" | "monthly" | "yearly" = ["weekly", "monthly", "yearly"].includes(rawPeriod) 
    ? (rawPeriod as "weekly" | "monthly" | "yearly") 
    : "monthly"

  const data = await getAnalyticsData(period);

  const statCards = [
    {
      label: 'Total Income',
      value: formatCurrency(data.totalIncome),
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(data.totalExpense),
      icon: TrendingDown,
      gradient: 'from-orange-500/20 to-orange-500/5',
      border: 'border-orange-500/20',
      textColor: 'text-orange-400',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(data.totalSavings),
      icon: PiggyBank,
      gradient: data.totalSavings >= 0 ? 'from-blue-500/20 to-blue-500/5' : 'from-gray-500/20 to-gray-500/5',
      border: data.totalSavings >= 0 ? 'border-blue-500/20' : 'border-gray-500/20',
      textColor: data.totalSavings >= 0 ? 'text-blue-400' : 'text-gray-400',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Deep financial insights and reports.</p>
        </div>

        {/* Period Selector (Simple Links for now, acts as tabs) */}
        <div className="flex bg-card border border-white/10 rounded-xl p-1 text-sm font-medium">
          <a
            href="?period=weekly"
            className={`px-4 py-2 rounded-lg transition-colors ${period === 'weekly' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Weekly
          </a>
          <a
            href="?period=monthly"
            className={`px-4 py-2 rounded-lg transition-colors ${period === 'monthly' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Monthly
          </a>
          <a
            href="?period=yearly"
            className={`px-4 py-2 rounded-lg transition-colors ${period === 'yearly' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Yearly
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`rounded-2xl border bg-gradient-to-br p-5 ${card.gradient} ${card.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`p-2 rounded-xl bg-white/10 ${card.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      <Suspense fallback={<div className="h-[400px] w-full border border-white/10 rounded-2xl animate-pulse bg-white/5" />}>
         <AnalyticsCharts trends={data.trends} categoryBreakdown={data.categoryBreakdown} />
      </Suspense>
    </div>
  );
}
