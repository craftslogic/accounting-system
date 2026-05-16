'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteCategoryAction } from '@/actions/categories'
import { toast } from '@/hooks/use-toast'
import { CategoryForm } from './CategoryForm'
import type { Category } from '@/types'

interface CategoriesClientProps {
  categories: Category[]
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)

  const income = categories.filter((c) => c.type === 'income')
  const expense = categories.filter((c) => c.type === 'expense')

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const result = await deleteCategoryAction(id)
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Category deleted', variant: 'success' as never })
    }
  }

  const CategoryGroup = ({ title, cats, type }: { title: string; cats: Category[]; type: 'income' | 'expense' }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full ${type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-muted-foreground">({cats.length})</span>
      </div>
      {cats.length === 0 ? (
        <p className="text-sm text-muted-foreground italic pl-4">No {type} categories yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center justify-between p-4 rounded-xl border border-white/10 bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
                >
                  {cat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setEditCat(cat)}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-400"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {categories.length} categories total
          </p>
        </div>
        <Button
          className="gradient-primary border-0 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <CategoryGroup title="Income" cats={income} type="income" />
      <CategoryGroup title="Expense" cats={expense} type="expense" />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <CategoryForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(open) => !open && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editCat && (
            <CategoryForm initialData={editCat} onSuccess={() => setEditCat(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
