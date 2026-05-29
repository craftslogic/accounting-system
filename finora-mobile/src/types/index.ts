// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: User;
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer' | 'opening_balance';

export type AccountType = 'cash' | 'bank' | 'wallet' | 'investment';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  note?: string;
  date: string;
  created_at: string;
  // Joined
  account?: Account;
  category?: Category;
}

export type ColorScheme = 'light' | 'dark';

export interface TabItem {
  name: string;
  label: string;
  icon: string;
}

// ─── Funds ────────────────────────────────────────────────────────────────────

export type FundTransactionType = 'allocate' | 'withdraw' | 'adjustment' | 'opening_balance';

export interface Fund {
  id: string;
  user_id: string;
  name: string;
  type: string;
  target_amount: number | null;
  current_amount: number;
  color: string;
  icon: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface FundWithStats extends Fund {
  progress_percentage: number;
  remaining_amount: number | null;
}

export interface FundTransaction {
  id: string;
  user_id: string;
  fund_id: string;
  account_id: string | null;
  type: FundTransactionType;
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  type: 'borrower' | 'lender' | 'both';
  created_at?: string;
}

export interface PeopleBalance {
  id: string;
  user_id: string;
  contact_id: string;
  type: 'payable' | 'receivable' | 'opening_payable' | 'opening_receivable';
  amount: number;
  note?: string;
  transaction_date: string;
  created_at?: string;
}

export interface PeopleBalanceWithContact extends PeopleBalance {
  contact?: Contact;
}

