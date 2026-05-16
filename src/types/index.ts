// ============================================================
// Core TypeScript Types for Personal Finance App
// ============================================================

export type AccountType = 'cash' | 'bank' | 'wallet' | 'savings' | 'custom'
export type TransactionType = 'income' | 'expense' | 'transfer'
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
export type BalanceType = 'payable' | 'receivable'

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
