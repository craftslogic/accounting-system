'use client'

import { useState } from 'react'
import { Edit, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { deleteBudget } from '@/actions/budgets'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { BudgetForm } from './BudgetForm'

export function BudgetCard({ budget, accounts, categories }: { budget: any, accounts: any[], categories: any[] }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const spent = budget.spent || 0
  const limit = budget.amount
  const progressPct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const isOverBudget = spent > limit

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this budget limit?')) return
    
    setIsDeleting(true)
    try {
      await deleteBudget(budget.id)
      toast({ title: 'Budget deleted successfully' })
    } catch (error) {
      toast({ title: 'Error deleting budget', variant: 'destructive' })
      setIsDeleting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5 group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg text-xl shrink-0">
            {budget.category?.icon || '🎯'}
          </div>
          <div>
            <h3 className="font-semibold truncate pr-2 max-w-[150px]">{budget.category?.name || 'All Categories'}</h3>
            <p className="text-xs text-muted-foreground capitalize">{budget.period} Budget</p>
          </div>
        </div>
        
        {/* Actions - visible on hover or mobile */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <p className="font-bold">{formatCurrency(budget.amount)}</p>
            <p className="text-xs text-muted-foreground">Limit</p>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-card p-1 rounded-lg border shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
              disabled={isDeleting}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-300"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className={`font-medium ${isOverBudget ? 'text-red-400' : ''}`}>
            {formatCurrency(spent)} ({progressPct}%)
          </span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-500`} 
            style={{ width: `${progressPct}%` }} 
          />
        </div>
      </div>

      <BudgetForm 
        accounts={accounts} 
        categories={categories} 
        initialData={budget}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </div>
  )
}
