import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Transaction, Account, Category } from '@/types';

// ─── Default categories (used when DB categories not loaded yet) ──────────────
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: 'fast-food-outline', color: '#F59E0B', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'car-outline', color: '#3B82F6', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline', color: '#8B5CF6', type: 'expense' },
  { id: 'bills', name: 'Bills', icon: 'flash-outline', color: '#EF4444', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'medkit-outline', color: '#10B981', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller-outline', color: '#EC4899', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'school-outline', color: '#06B6D4', type: 'expense' },
  { id: 'other_expense', name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#94A3B8', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: 'briefcase-outline', color: '#10B981', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop-outline', color: '#2563EB', type: 'income' },
  { id: 'business', name: 'Business', icon: 'business-outline', color: '#6366F1', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'trending-up-outline', color: '#F59E0B', type: 'income' },
  { id: 'other_income', name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#94A3B8', type: 'income' },
];

interface TransactionStore {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Fetch
  fetchTransactions: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAll: () => Promise<void>;

  // Create
  addTransaction: (input: AddTransactionInput) => Promise<{ success: boolean; error?: string }>;
  addAccount: (input: AddAccountInput) => Promise<{ success: boolean; error?: string }>;
  addCategory: (input: AddCategoryInput) => Promise<{ success: boolean; error?: string }>;

  // Update
  updateTransaction: (id: string, input: Partial<AddTransactionInput>) => Promise<{ success: boolean; error?: string }>;

  // Delete
  deleteTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export interface AddCategoryInput {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface AddAccountInput {
  name: string;
  type: string;
  currency: string;
  initialBalance?: number;
}

export interface AddTransactionInput {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account_id: string;          // from_account_id for expense/transfer
  to_account_id?: string;      // for transfer
  category_id?: string;        // category UUID from DB or our local ID
  note?: string;
  transaction_date: string;    // YYYY-MM-DD
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  accounts: [],
  categories: DEFAULT_CATEGORIES,
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          from_account:accounts!transactions_from_account_id_fkey(id, name, type, currency),
          to_account:accounts!transactions_to_account_id_fkey(id, name, type, currency)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) { set({ error: error.message }); return; }

      // Normalize to our Transaction type
      const txs: Transaction[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        account_id: row.from_account_id ?? row.to_account_id ?? '',
        category_id: row.category_id ?? '',
        amount: parseFloat(String(row.amount)),
        type: row.type,
        note: row.note,
        date: row.transaction_date,
        created_at: row.created_at,
        category: row.category
          ? {
              id: row.category.id,
              name: row.category.name,
              icon: row.category.icon,
              color: row.category.color,
              type: row.category.type,
            }
          : undefined,
        account: row.from_account ?? row.to_account ?? undefined,
      }));

      set({ transactions: txs });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAccounts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('name');

      // Calculate balance from transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount, from_account_id, to_account_id')
        .eq('user_id', user.id);

      const balanceMap: Record<string, number> = {};
      for (const acc of accounts ?? []) balanceMap[acc.id] = 0;

      for (const tx of txs ?? []) {
        const amt = parseFloat(String(tx.amount));
        if (tx.type === 'income' && tx.to_account_id && tx.to_account_id in balanceMap) {
          balanceMap[tx.to_account_id] += amt;
        } else if (tx.type === 'expense' && tx.from_account_id && tx.from_account_id in balanceMap) {
          balanceMap[tx.from_account_id] -= amt;
        } else if (tx.type === 'transfer') {
          if (tx.from_account_id && tx.from_account_id in balanceMap) balanceMap[tx.from_account_id] -= amt;
          if (tx.to_account_id && tx.to_account_id in balanceMap) balanceMap[tx.to_account_id] += amt;
        }
      }

      const accountsWithBalance: Account[] = (accounts ?? []).map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        name: a.name,
        type: a.type as any,
        balance: balanceMap[a.id] ?? 0,
        currency: a.currency,
        created_at: a.created_at,
      }));

      set({ accounts: accountsWithBalance });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchCategories: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (data && data.length > 0) {
        const cats: Category[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type,
        }));
        set({ categories: cats });
      } else {
        // No user categories yet — keep defaults
        set({ categories: DEFAULT_CATEGORIES });
      }
    } catch {
      // Keep defaults on error
    }
  },

  fetchAll: async () => {
    await Promise.all([
      get().fetchAccounts(),
      get().fetchCategories(),
      get().fetchTransactions(),
    ]);
  },

  addTransaction: async (input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      // ── Balance guard: prevent negative balance on expense/transfer ──
      if (input.type === 'expense' || input.type === 'transfer') {
        const accounts = get().accounts;
        const fromAccount = accounts.find(a => a.id === input.account_id);
        if (fromAccount && fromAccount.balance < input.amount) {
          return {
            success: false,
            error: `Insufficient balance. ${fromAccount.name} has PKR ${fromAccount.balance.toLocaleString()} but you are trying to ${input.type} PKR ${input.amount.toLocaleString()}.`,
          };
        }
      }

      const payload: Record<string, any> = {
        user_id: user.id,
        type: input.type,
        amount: input.amount,
        note: input.note || null,
        transaction_date: input.transaction_date,
      };

      if (input.type === 'income') {
        payload.to_account_id = input.account_id;
      } else if (input.type === 'expense') {
        payload.from_account_id = input.account_id;
      } else if (input.type === 'transfer') {
        payload.from_account_id = input.account_id;
        payload.to_account_id = input.to_account_id;
      }

      // If category_id is a UUID (DB category), use it; if it's our local default ID skip it
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(input.category_id ?? '');
      if (isUuid) payload.category_id = input.category_id;

      const { error } = await supabase.from('transactions').insert(payload);
      if (error) return { success: false, error: error.message };

      // Refresh data
      await get().fetchAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  addAccount: async (input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: input.name,
          type: input.type,
          currency: input.currency,
        })
        .select('id')
        .single();

      if (error) return { success: false, error: error.message };

      // If initial balance provided, insert an opening income transaction
      if (input.initialBalance && input.initialBalance > 0 && newAccount?.id) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'income',
          amount: input.initialBalance,
          to_account_id: newAccount.id,
          note: 'Opening balance',
          transaction_date: new Date().toISOString().split('T')[0],
        });
      }

      // Refresh accounts list
      await get().fetchAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  updateTransaction: async (id, input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const patch: Record<string, any> = {};
      if (input.amount !== undefined) patch.amount = input.amount;
      if (input.note !== undefined) patch.note = input.note || null;
      if (input.transaction_date !== undefined) patch.transaction_date = input.transaction_date;

      const { error } = await supabase
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) return { success: false, error: error.message };

      await get().fetchAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  deleteTransaction: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) return { success: false, error: error.message };

      // Refresh data
      await get().fetchAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  addCategory: async (input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: input.name,
        type: input.type,
        color: input.color,
        icon: input.icon,
      });

      if (error) return { success: false, error: error.message };

      await get().fetchCategories();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
}));
