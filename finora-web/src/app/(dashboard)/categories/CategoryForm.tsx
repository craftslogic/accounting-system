'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { createCategoryAction, updateCategoryAction } from '@/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils'
import type { Category, ActionResult } from '@/types'

interface CategoryFormProps {
  initialData?: Category
  onSuccess?: () => void
}

const initialState: ActionResult<Category> = { success: false, error: '' }

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const [selectedColor, setSelectedColor] = useState(
    initialData?.color ?? CATEGORY_COLORS[0]
  )
  const [selectedIcon, setSelectedIcon] = useState(
    initialData?.icon ?? CATEGORY_ICONS[0]
  )

  const [state, setState] = useState<ActionResult<Category>>(initialState)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    try {
      let res;
      if (initialData) {
        res = await updateCategoryAction(initialData.id, state, formData)
      } else {
        res = await createCategoryAction(state, formData)
      }
      setState(res)
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    if (state?.success) {
      toast({ title: initialData ? 'Category updated' : 'Category created', variant: 'success' as never })
      onSuccess?.()
    }
  }, [state?.success, initialData, onSuccess, toast])

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cat-name">Category Name</Label>
        <Input
          id="cat-name"
          name="name"
          placeholder="e.g. Groceries"
          defaultValue={initialData?.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-type">Type</Label>
        <Select name="type" defaultValue={initialData?.type ?? 'expense'} required>
          <SelectTrigger id="cat-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <input type="hidden" name="color" value={selectedColor} />
      </div>

      {/* Icon Picker */}
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {CATEGORY_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                selectedIcon === icon
                  ? 'ring-2 ring-primary bg-primary/20 scale-110'
                  : 'hover:bg-accent'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
        <input type="hidden" name="icon" value={selectedIcon} />
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: `${selectedColor}20`, border: `1px solid ${selectedColor}40` }}
        >
          {selectedIcon}
        </div>
        <span className="text-sm font-medium">Preview</span>
      </div>

      <Button
        type="submit"
        className="w-full gradient-primary border-0 text-white font-semibold h-11"
        disabled={pending}
      >
        {pending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : initialData ? 'Update Category' : 'Create Category'}
      </Button>
    </form>
  )
}
