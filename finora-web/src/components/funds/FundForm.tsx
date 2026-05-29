'use client'

import { useActionState, useEffect, useState } from 'react'
import { createFundAction, updateFundAction } from '@/actions/funds'
import { Button } from '@/components/ui/button'
import type { ActionResult, Fund } from '@/types'

const FUND_ICONS = [
  '🛡️', '🏖️', '🕌', '🚗', '💍', '🏠', '📈', '💊', '✈️', '🎓',
  '🎁', '🏋️', '💻', '🌍', '🎨', '🍔', '⚡', '🐾', '🔧', '💰',
  '🏦', '🌱', '🎯', '🎉', '🏥', '🚀', '🛒', '🎶', '📱', '🔑',
]

const FUND_COLORS = [
  '#6366f1', // violet
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // fuchsia
]

const FUND_TYPES = [
  { value: 'emergency', label: '🛡️ Emergency' },
  { value: 'savings', label: '💰 Savings' },
  { value: 'vacation', label: '🏖️ Vacation' },
  { value: 'vehicle', label: '🚗 Vehicle' },
  { value: 'education', label: '🎓 Education' },
  { value: 'investment', label: '📈 Investment' },
  { value: 'charity', label: '🕌 Charity / Sadqa' },
  { value: 'bills', label: '⚡ Bills' },
  { value: 'health', label: '💊 Health' },
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'home', label: '🏠 Home' },
  { value: 'custom', label: '✨ Custom' },
]

interface FundFormProps {
  fund?: Fund
  onSuccess?: () => void
  onCancel?: () => void
}

const initialState: ActionResult<Fund> = { success: false, error: '' }

export function FundForm({ fund, onSuccess, onCancel }: FundFormProps) {
  const isEdit = !!fund

  const boundAction = isEdit
    ? updateFundAction.bind(null, fund.id)
    : createFundAction

  const [state, formAction, isPending] = useActionState(boundAction as typeof createFundAction, initialState)

  const [selectedColor, setSelectedColor] = useState(fund?.color ?? '#6366f1')
  const [selectedIcon, setSelectedIcon] = useState(fund?.icon ?? '🏦')

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden fields for color and icon */}
      <input type="hidden" name="color" value={selectedColor} />
      <input type="hidden" name="icon" value={selectedIcon} />

      {/* Preview */}
      <div className="flex items-center justify-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 transition-all duration-300"
          style={{
            backgroundColor: `${selectedColor}20`,
            borderColor: `${selectedColor}50`,
            boxShadow: `0 0 20px ${selectedColor}30`,
          }}
        >
          {selectedIcon}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Fund Name *</label>
        <input
          name="name"
          defaultValue={fund?.name ?? ''}
          required
          placeholder="e.g. Emergency Fund, Vacation Fund…"
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Fund Type</label>
        <select
          name="type"
          defaultValue={fund?.type ?? 'custom'}
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
        >
          {FUND_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Target Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Goal Amount <span className="text-xs text-muted-foreground/60">(optional)</span>
        </label>
        <input
          name="target_amount"
          type="number"
          min="0"
          step="1"
          defaultValue={fund?.target_amount ?? ''}
          placeholder="e.g. 100,000"
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Opening Balance (Only on Create) */}
      {!isEdit && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Opening Balance <span className="text-xs text-muted-foreground/60">(optional)</span>
          </label>
          <input
            name="initial_balance"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 50,000"
            className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the amount already available before you started using Finora.
          </p>
        </div>
      )}

      {/* Icon Picker */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Icon</label>
        <div className="grid grid-cols-10 gap-1.5">
          {FUND_ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all duration-150 hover:scale-110 ${
                selectedIcon === icon ? 'scale-110' : 'bg-accent/50 hover:bg-accent'
              }`}
              style={selectedIcon === icon ? {
                backgroundColor: `${selectedColor}20`,
                outline: `2px solid ${selectedColor}`,
                outlineOffset: '1px',
              } : {}}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Color</label>
        <div className="flex flex-wrap gap-2">
          {FUND_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 ${
                selectedColor === color ? 'scale-110' : ''
              }`}
              style={{
                backgroundColor: color,
                outline: selectedColor === color ? `3px solid ${color}` : 'none',
                outlineOffset: '2px',
                boxShadow: selectedColor === color ? `0 0 12px ${color}80` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Description <span className="text-xs text-muted-foreground/60">(optional)</span>
        </label>
        <textarea
          name="description"
          defaultValue={fund?.description ?? ''}
          placeholder="What is this fund for?"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-white/10 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      {/* Error */}
      {state.success === false && state.error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">
          {state.error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
          style={{ backgroundColor: selectedColor, color: '#fff' }}
        >
          {isPending ? 'Saving…' : isEdit ? 'Update Fund' : 'Create Fund'}
        </Button>
      </div>
    </form>
  )
}
