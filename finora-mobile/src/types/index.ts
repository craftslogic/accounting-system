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

export type TransactionType = 'income' | 'expense' | 'transfer';

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

// ─── UI ───────────────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark';

export interface TabItem {
  name: string;
  label: string;
  icon: string;
}
