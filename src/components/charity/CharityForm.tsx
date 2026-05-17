'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createCharityRecord } from '@/actions/charity'

export function CharityForm({ accounts }: { accounts: any[] }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initialDate, setInitialDate] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setInitialDate(new Date().toISOString().split('T')[0])
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await createCharityRecord(formData)
      
      toast({ title: 'Record created successfully' })
      setOpen(false)
      router.refresh()
    } catch (error) {
       toast({ title: 'Error creating record', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          <span>New Record</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup Recurring Sadqa / Charity</DialogTitle>
          <DialogDescription className="hidden">Fill out the form below to set up a new charity record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Description / Cause</Label>
            <Input id="note" name="note" required placeholder="e.g. Local Orphanage via Transfer" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select name="frequency" defaultValue="monthly">
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
             <Label htmlFor="account_id">Payment Account <span className="text-muted-foreground text-xs">(optional)</span></Label>
             <Select name="account_id">
               <SelectTrigger>
                 <SelectValue placeholder="No Default Account" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="none">No Default Account</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
             <Label htmlFor="next_date">Initial Date</Label>
             <Input id="next_date" name="next_date" type="date" required defaultValue={initialDate} key={initialDate} />
          </div>

          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2">
               <input type="checkbox" id="auto_reminder" name="auto_reminder" value="true" defaultChecked className="h-4 w-4 bg-transparent border-white/20 rounded" />
               <Label htmlFor="auto_reminder" className="font-normal text-xs text-muted-foreground">Send Reminder</Label>
            </div>
            <div className="flex items-center gap-2">
               <input type="checkbox" id="auto_generate_transaction" name="auto_generate_transaction" value="true" className="h-4 w-4 bg-transparent border-white/20 rounded" />
               <Label htmlFor="auto_generate_transaction" className="font-normal text-xs text-muted-foreground">Auto-Pay (Logs Expense)</Label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Record'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}