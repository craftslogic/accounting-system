'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import { formatCurrency } from '@/utils/currency'

interface AnalyticsChartsProps {
  trends: {
    date: string
    income: number
    expense: number
    savings: number
  }[]
  categoryBreakdown: {
    name: string
    color: string
    icon: string
    amount: number
  }[]
}

const FALLBACK_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

const tooltipStyle = {
  background: '#1a1f2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e5e7eb',
}

export function AnalyticsCharts({ trends, categoryBreakdown }: AnalyticsChartsProps) {
  const total = categoryBreakdown.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      
      {/* Cash Flow Chart */}
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Cash Flow Pattern</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatCurrency(value)} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Net Savings Trend */}
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Savings Trend</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatCurrency(value)} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="savings" name="Net Savings" radius={[4, 4, 0, 0]}>
                  {trends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.savings >= 0 ? '#6366f1' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie */}
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Expenses</h2>
          {categoryBreakdown.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4 h-[250px]">
              <div className="flex-1 min-h-[0]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart cursor="pointer">
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 py-4">
                {categoryBreakdown.map((cat, index) => (
                  <div key={cat.name} className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: cat.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
                      />
                      <span className="text-sm text-foreground truncate">
                        {cat.icon} {cat.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(cat.amount)}</p>
                      <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((cat.amount / total) * 100) : 0}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-white/10 rounded-xl">
              No expense data available for this period.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}