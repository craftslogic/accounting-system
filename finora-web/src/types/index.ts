// ============================================================
// Core TypeScript Types for Personal Finance App
// ============================================================

export type AccountType = 'cash' | 'bank' | 'wallet' | 'savings' | 'custom'
export type TransactionType = 'income' | 'expense' | 'transfer' | 'opening_balance'
export type CategoryType = 'income' | 'expense'

// ---- Account ----
export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: string
  is_archived: boolean
  created_at: string
}

export interface AccountWithBalance extends Account {
  balance: number
}

// ---- Category ----
export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  color: string
  icon: string
  created_at: string
}

// ---- Transaction ----
export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category_id: string | null
  from_account_id: string | null
  to_account_id: string | null
  note: string | null
  transaction_date: string
  created_at: string
}

export interface TransactionWithDetails extends Transaction {
  category: Category | null
  from_account: Account | null
  to_account: Account | null
}

// ---- People Balances ----
export type ContactType = 'friend' | 'family' | 'client' | 'custom'
export type BalanceType = 'payable' | 'receivable' | 'opening_payable' | 'opening_receivable'

export interface Contact {
  id: string
  user_id: string
  name: string
  type: ContactType
  created_at: string
}

export interface ContactWithBalance extends Contact {
  balance: number
  total_payable: number
  total_receivable: number
}

export interface PeopleBalance {
  id: string
  user_id: string
  contact_id: string
  type: BalanceType
  amount: number
  note: string | null
  transaction_date: string
  created_at: string
}

export interface PeopleBalanceWithContact extends PeopleBalance {
  contact: Contact
}

// ---- Dashboard ----
export interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  netSavings: number
  totalPayable: number
  totalReceivable: number
  actualBalance: number
}

export interface CategoryExpense {
  category: Category
  amount: number
  percentage: number
}

// ---- API Response ----
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ---- Form Types ----
export interface CreateAccountInput {
  name: string
  type: AccountType
  currency: string
}

export interface UpdateAccountInput {
  name: string
  type: AccountType
  currency: string
}

export interface CreateCategoryInput {
  name: string
  type: CategoryType
  color: string
  icon: string
}

export interface CreateTransactionInput {
  type: TransactionType
  amount: number
  category_id?: string
  from_account_id?: string
  to_account_id?: string
  note?: string
  transaction_date: string
}

// ---- Filter Types ----
export interface TransactionFilters {
  search?: string
  type?: TransactionType | 'all'
  account_id?: string
  category_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

// ============================================================
// FUNDS SYSTEM
// ============================================================

export type FundTransactionType = 'allocate' | 'withdraw' | 'adjustment' | 'opening_balance'
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

// ---- Fund ----
export interface Fund {
  id: string
  user_id: string
  name: string
  type: string
  target_amount: number | null
  current_amount: number
  color: string
  icon: string
  description: string | null
  is_archived: boolean
  created_at: string
}

// ---- Fund Transaction ----
export interface FundTransaction {
  id: string
  user_id: string
  fund_id: string
  account_id: string | null
  type: FundTransactionType
  amount: number
  note: string | null
  transaction_date: string
  created_at: string
}

export interface FundTransactionWithDetails extends FundTransaction {
  fund: Fund | null
  account: Account | null
}

// ---- Recurring Fund Allocation ----
export interface FundRecurring {
  id: string
  user_id: string
  fund_id: string
  account_id: string | null
  amount: number
  frequency: RecurringFrequency
  next_date: string
  auto_generate_transaction: boolean
  auto_reminder: boolean
  note: string | null
  is_active: boolean
  created_at: string
}

// ---- Fund with stats ----
export interface FundWithStats extends Fund {
  progress_percentage: number
  remaining_amount: number | null
  total_allocated: number
  total_withdrawn: number
}

// ---- Fund Dashboard Stats ----
export interface FundDashboardStats {
  totalReserved: number
  totalFunds: number
  activeFunds: number
  highestFund: Fund | null
  monthlyAllocations: number
}

// ---- Form Input Types ----
export interface CreateFundInput {
  name: string
  type: string
  target_amount?: number
  color: string
  icon: string
  description?: string
}

export interface CreateFundTransactionInput {
  fund_id: string
  account_id?: string
  type: FundTransactionType
  amount: number
  note?: string
  transaction_date: string
}
