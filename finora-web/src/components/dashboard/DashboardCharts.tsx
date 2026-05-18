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
} from 'recharts'
import { formatCurrency } from '@/utils/currency'

interface CategoryData {
  name: string
  color: string
  icon: string
  amount: number
}

interface DashboardChartsProps {
  categoryBreakdown: CategoryData[]
  monthlyIncome: number
  monthlyExpenses: number
}

const FALLBACK_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

/**
 * Client-side charts for the dashboard using Recharts.
 */
export function DashboardCharts({
  categoryBreakdown,
  monthlyIncome,
  monthlyExpenses,
}: DashboardChartsProps) {
  const barData = [
    { name: 'Income', amount: monthlyIncome, fill: '#22c55e' },
    { name: 'Expenses', amount: monthlyExpenses, fill: '#ef4444' },
    { name: 'Savings', amount: Math.max(0, monthlyIncome - monthlyExpenses), fill: '#6366f1' },
  ]

  const total = categoryBreakdown.reduce((s, c) => s + c.amount, 0)

  if (categoryBreakdown.length === 0 && monthlyIncome === 0 && monthlyExpenses === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Summary Bar */}
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Summary</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1f2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#e5e7eb',
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown Pie */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
          <div className="flex gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#e5e7eb',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px] pr-1">
              {categoryBreakdown.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: cat.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {cat.icon} {cat.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium shrink-0">
                    {total > 0 ? Math.round((cat.amount / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
