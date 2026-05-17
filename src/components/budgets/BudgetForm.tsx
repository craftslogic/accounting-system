'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createBudget } from '@/actions/budgets'

export function BudgetForm({ categories, accounts }: { categories: any[]; accounts: any[] }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await createBudget(formData)
      
      toast({ title: 'Budget created successfully' })
      setOpen(false)
      router.refresh()
    } catch (error) {
       toast({ title: 'Error creating budget', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          <span>New Budget</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget Limit</DialogTitle>
          <DialogDescription className="hidden">Fill out the form below to add a new budget.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Limit Amount (<span className="text-muted-foreground">e.g. 500</span>)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Select name="period" defaultValue="monthly">
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category Setup <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select name="category_id">
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="none">All Categories</SelectItem>
                 {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                 ))}
              </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
             <Label htmlFor="account_id">Link to Account <span className="text-muted-foreground text-xs">(optional)</span></Label>
             <Select name="account_id">
               <SelectTrigger>
                 <SelectValue placeholder="All Accounts" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="none">All Accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
               </SelectContent>
             </Select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Create Budget'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}