'use client'

import { useState, useEffect, useActionState } from 'react'
import {
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
  ArrowDownToLine, ArrowUpFromLine, History, Zap,
  AlertTriangle, Check,
} from 'lucide-react'
import {
  createOpeningEntryAction,
  createPeopleTransactionAction,
  handleOverpaymentAction,
} from '@/actions/people'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { today } from '@/utils/dates'
import { formatCurrency } from '@/utils/currency'
import type { ContactWithBalance, PeopleBalance, ActionResult } from '@/types'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type RelationshipType = 'payable' | 'receivable'
type RecordingMode = 'existing' | 'new'
// For new transactions
type NewTxSubtype = 'borrow' | 'lend' | 'repay' | 'collect'

interface SimpleAccount {
  id: string
  name: string
  type: string
}

interface BalanceFormProps {
  contacts: ContactWithBalance[]
  accounts: SimpleAccount[]
  /** Pre-selected contact (e.g. from person detail page) */
  preSelectedContactId?: string
  /** Pre-selected subtype (e.g. 'repay' from "Record Payment" button) */
  preSelectedSubtype?: NewTxSubtype
  initialData?: PeopleBalance
  onSuccess?: () => void
}

// Step IDs
type Step = 'person' | 'relationship' | 'mode' | 'details'

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function subtypeLabel(s: NewTxSubtype) {
  switch (s) {
    case 'borrow': return 'I borrowed money'
    case 'lend':   return 'I lent money'
    case 'repay':  return 'I repaid a debt'
    case 'collect': return 'I collected a repayment'
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

const initialStateOpening: ActionResult<PeopleBalance> = { success: false, error: '' }
const initialStateTx: ActionResult<PeopleBalance> = { success: false, error: '' }

export function BalanceForm({
  contacts,
  accounts,
  preSelectedContactId,
  preSelectedSubtype,
  initialData,
  onSuccess,
}: BalanceFormProps) {
  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(
    preSelectedContactId ? (preSelectedSubtype ? 'details' : 'relationship') : 'person'
  )
  const [contactId, setContactId] = useState(preSelectedContactId ?? initialData?.contact_id ?? '')
  const [relationship, setRelationship] = useState<RelationshipType>(
    preSelectedSubtype === 'borrow' || preSelectedSubtype === 'repay' ? 'payable'
    : preSelectedSubtype === 'lend' || preSelectedSubtype === 'collect' ? 'receivable'
    : initialData?.type === 'opening_payable' || initialData?.type === 'payable' ? 'payable' : 'receivable'
  )
  const [mode, setMode] = useState<RecordingMode>(
    preSelectedSubtype ? 'new'
    : initialData && initialData.type !== 'opening_payable' && initialData.type !== 'opening_receivable' ? 'new' : 'existing'
  )
  const [subtype, setSubtype] = useState<NewTxSubtype>(preSelectedSubtype ?? 'borrow')

  // ── Form fields ───────────────────────────────────────────────────────────
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '')
  const [accountId, setAccountId] = useState(initialData?.account_id ?? '')
  const [note, setNote] = useState(initialData?.note ?? '')
  const [date, setDate] = useState(
    initialData ? String(initialData.transaction_date).split('T')[0] : today()
  )

  // ── Overpayment state ─────────────────────────────────────────────────────
  const [overpaymentOutstanding, setOverpaymentOutstanding] = useState<number | null>(null)
  const [isHandlingOverpayment, setIsHandlingOverpayment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Server actions ────────────────────────────────────────────────────────
  const [openingState, openingFormAction, openingPending] = useActionState(
    createOpeningEntryAction,
    initialStateOpening
  )
  const [txState, txFormAction, txPending] = useActionState(
    createPeopleTransactionAction,
    initialStateTx
  )

  // Handle opening entry success
  useEffect(() => {
    if (openingState?.success) {
      toast({ title: 'Opening balance recorded', variant: 'success' as never })
      onSuccess?.()
    }
  }, [openingState?.success])

  // Handle transaction success or overpayment
  useEffect(() => {
    if (!txState) return
    if (txState.success) {
      toast({ title: 'Transaction recorded successfully', variant: 'success' as never })
      onSuccess?.()
      return
    }
    if (!txState.success && txState.error?.startsWith('OVERPAYMENT:')) {
      const outstanding = parseFloat(txState.error.replace('OVERPAYMENT:', ''))
      setOverpaymentOutstanding(outstanding)
    }
  }, [txState?.success, (txState as any)?.error])

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedContact = contacts.find((c) => c.id === contactId)
  const pending = openingPending || txPending || isSubmitting

  // When relationship changes, auto-adjust subtype if it mismatches the relationship
  useEffect(() => {
    if (mode === 'new') {
      if (relationship === 'payable') {
        if (subtype !== 'borrow' && subtype !== 'repay') setSubtype('borrow')
      } else {
        if (subtype !== 'lend' && subtype !== 'collect') setSubtype('lend')
      }
    }
  }, [relationship, mode]) // we intentionally don't include subtype to avoid loops

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleOverpaymentConvert() {
    if (!overpaymentOutstanding || !contactId || !accountId) return
    setIsHandlingOverpayment(true)
    const settleSubtype = subtype === 'repay' ? 'repay' : 'collect'
    const res = await handleOverpaymentAction(
      contactId,
      settleSubtype,
      parseFloat(amount),
      overpaymentOutstanding,
      accountId,
      note || null,
      date
    )
    setIsHandlingOverpayment(false)
    if (res.success) {
      toast({ title: 'Overpayment handled — excess converted to opposite balance', variant: 'success' as never })
      setOverpaymentOutstanding(null)
      onSuccess?.()
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' })
    }
  }

  function handleOverpaymentEdit() {
    setOverpaymentOutstanding(null)
    setAmount(overpaymentOutstanding ? overpaymentOutstanding.toFixed(2) : '')
  }

  // No contacts guard
  if (contacts.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground text-sm">
          Please add a person first using the &quot;Add Person&quot; button.
        </p>
      </div>
    )
  }

  // ── Overpayment warning screen ────────────────────────────────────────────
  if (overpaymentOutstanding !== null) {
    const excess = parseFloat(amount) - overpaymentOutstanding
    return (
      <div className="space-y-5 py-2">
        <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-orange-400">Amount Exceeds Outstanding Balance</p>
            <p className="text-sm text-muted-foreground mt-1">
              The outstanding balance is only{' '}
              <span className="font-bold text-foreground">{formatCurrency(overpaymentOutstanding)}</span>.
              You entered{' '}
              <span className="font-bold text-foreground">{formatCurrency(parseFloat(amount))}</span>,
              which is {formatCurrency(excess)} more than owed.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">What would you like to do?</p>

          <button
            type="button"
            onClick={handleOverpaymentConvert}
            disabled={isHandlingOverpayment}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all text-left"
          >
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-400">
                {isHandlingOverpayment ? 'Processing...' : 'Convert excess to opposite balance'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Settle {formatCurrency(overpaymentOutstanding)} and create a{' '}
                {subtype === 'repay' ? 'receivable' : 'payable'} of {formatCurrency(excess)} for{' '}
                {selectedContact?.name}.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleOverpaymentEdit}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Edit amount</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Go back and enter {formatCurrency(overpaymentOutstanding)} or less.
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderStep = () => {
    // STEP 1: Select person
    if (step === 'person') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Who is this about?</Label>
            <Select value={contactId} onValueChange={(v) => setContactId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent onPointerDownOutside={(e) => e.stopPropagation()}>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="w-full gradient-primary border-0 text-white"
            disabled={!contactId}
            onClick={() => setStep('relationship')}
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )
    }

    // STEP 2: Relationship type
    if (step === 'relationship') {
      return (
        <div className="space-y-4">
          {selectedContact && (
            <p className="text-sm text-muted-foreground">
              Recording for <span className="font-semibold text-foreground">{selectedContact.name}</span>
            </p>
          )}
          <Label>What is the relationship?</Label>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setRelationship('payable')}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                relationship === 'payable'
                  ? 'border-orange-500/50 bg-orange-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                relationship === 'payable' ? 'bg-orange-500/20' : 'bg-white/10'
              }`}>
                <ArrowDownToLine className={`w-5 h-5 ${relationship === 'payable' ? 'text-orange-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`font-semibold ${relationship === 'payable' ? 'text-orange-400' : 'text-foreground'}`}>
                  I need to pay this person
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedContact?.name ?? 'They'} is a creditor — I owe them money
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRelationship('receivable')}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                relationship === 'receivable'
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                relationship === 'receivable' ? 'bg-emerald-500/20' : 'bg-white/10'
              }`}>
                <ArrowUpFromLine className={`w-5 h-5 ${relationship === 'receivable' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`font-semibold ${relationship === 'receivable' ? 'text-emerald-400' : 'text-foreground'}`}>
                  This person needs to pay me
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedContact?.name ?? 'They'} is a debtor — they owe me money
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setStep('person')} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              type="button"
              className="flex-1 gradient-primary border-0 text-white"
              onClick={() => setStep('mode')}
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )
    }

    // STEP 3: Mode (existing / new)
    if (step === 'mode') {
      return (
        <div className="space-y-4">
          <Label>What are you recording?</Label>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                mode === 'existing'
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                mode === 'existing' ? 'bg-primary/20' : 'bg-white/10'
              }`}>
                <History className={`w-5 h-5 ${mode === 'existing' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`font-semibold ${mode === 'existing' ? 'text-primary' : 'text-foreground'}`}>
                  Existing Balance
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This balance already existed before you started using Finoraa.
                  Your account balance will not change.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                mode === 'new'
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                mode === 'new' ? 'bg-primary/20' : 'bg-white/10'
              }`}>
                <Zap className={`w-5 h-5 ${mode === 'new' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className={`font-semibold ${mode === 'new' ? 'text-primary' : 'text-foreground'}`}>
                  New Transaction
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This is happening now. Account balance will be updated accordingly.
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setStep('relationship')} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              type="button"
              className="flex-1 gradient-primary border-0 text-white"
              onClick={() => setStep('details')}
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )
    }

    // STEP 4: Details (amount, account, note, date)
    if (step === 'details') {
      const isExisting = mode === 'existing'
      const action = isExisting ? openingFormAction : txFormAction
      const error = isExisting
        ? (!openingState.success ? openingState.error : undefined)
        : (!txState.success ? txState.error : undefined)

      // Determine visible subtype options for "new" mode
      const subtypeOptions: { value: NewTxSubtype; label: string; description: string }[] =
        relationship === 'payable'
          ? [
              { value: 'borrow', label: 'Borrowed money', description: 'They gave me money and I owe it back' },
              { value: 'repay', label: 'Repaid debt', description: 'I paid them back some or all of what I owed' },
            ]
          : [
              { value: 'lend', label: 'Lent money', description: 'I gave them money and they owe it back' },
              { value: 'collect', label: 'Collected repayment', description: 'They paid me back some or all they owed' },
            ]

      const needsAccount = !isExisting

      return (
        <form action={action} className="space-y-4">
          {/* Hidden fields */}
          <input type="hidden" name="contact_id" value={contactId} />
          {isExisting ? (
            <input
              type="hidden"
              name="entry_type"
              value={relationship === 'payable' ? 'opening_payable' : 'opening_receivable'}
            />
          ) : (
            <input type="hidden" name="subtype" value={subtype} />
          )}

          {/* Error */}
          {error && !error.startsWith('OVERPAYMENT:') && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
            <span className="text-muted-foreground">Person:</span>
            <span className="font-semibold">{selectedContact?.name}</span>
            <span className="text-white/20">·</span>
            <span className={relationship === 'payable' ? 'text-orange-400' : 'text-emerald-400'}>
              {relationship === 'payable' ? 'I need to pay them' : 'They need to pay me'}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-muted-foreground">{isExisting ? 'Existing' : 'New'}</span>
          </div>

          {/* Subtype selector for new transactions */}
          {!isExisting && (
            <div className="space-y-2">
              <Label>Transaction type</Label>
              <div className="grid grid-cols-2 gap-2">
                {subtypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSubtype(opt.value)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      subtype === opt.value
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    <span className="font-semibold block">{opt.label}</span>
                    <span className="opacity-75 mt-0.5 block">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Account selector */}
          <div className="space-y-2">
            <Label htmlFor="account_id">
              {isExisting ? 'Associated Account (optional)' : 'Account *'}
            </Label>
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No accounts found. Please add an account first.
              </p>
            ) : (
              <Select
                name="account_id"
                value={accountId}
                onValueChange={setAccountId}
                required={needsAccount}
              >
                <SelectTrigger id="account_id">
                  <SelectValue placeholder={isExisting ? 'Select account (optional)' : 'Select account'} />
                </SelectTrigger>
                <SelectContent onPointerDownOutside={(e) => e.stopPropagation()}>
                  {!isExisting ? null : (
                    <SelectItem value="none">None</SelectItem>
                  )}
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isExisting && (
              <p className="text-xs text-muted-foreground">
                Choosing an account helps associate this liability/receivable, but will NOT change the account balance.
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="transaction_date">Date</Label>
            <Input
              id="transaction_date"
              name="transaction_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. Loan for rent, Birthday gift, etc."
            />
          </div>

          <div className="flex gap-2 pt-1">
            {!preSelectedContactId && (
              <Button type="button" variant="outline" onClick={() => setStep('mode')} disabled={pending}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 gradient-primary border-0 text-white"
              disabled={pending || (needsAccount && !accountId && accounts.length > 0)}
            >
              {pending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                isExisting ? 'Record Opening Balance' : 'Record Transaction'
              )}
            </Button>
          </div>
        </form>
      )
    }

    return null
  }

  // ── Step indicator ────────────────────────────────────────────────────────
  const steps: { id: Step; label: string }[] = [
    { id: 'person', label: 'Person' },
    { id: 'relationship', label: 'Direction' },
    { id: 'mode', label: 'Type' },
    { id: 'details', label: 'Details' },
  ]
  const stepIndex = steps.findIndex((s) => s.id === step)

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      {!preSelectedContactId && (
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-all ${
                i <= stepIndex ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
              }`}>
                {i < stepIndex ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-xs transition-all ${
                i === stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>{s.label}</span>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 transition-all ${i < stepIndex ? 'bg-primary/50' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {renderStep()}
    </div>
  )
}
