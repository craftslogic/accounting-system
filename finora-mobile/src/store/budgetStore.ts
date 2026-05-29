import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Budget {
  id: string;
  user_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  category_id: string | null;
  account_id: string | null;
  created_at: string;
  // Joined
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string } | null;
}

interface BudgetStore {
  budgets: Budget[];
  isLoading: boolean;

  fetchBudgets: () => Promise<void>;
  createBudget: (input: CreateBudgetInput) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (id: string) => Promise<{ success: boolean; error?: string }>;

  /** Total monthly budget limit (sum of all monthly budgets) */
  getTotalMonthlyLimit: () => number;
}

export interface CreateBudgetInput {
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  category_id?: string;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  isLoading: false,

  getTotalMonthlyLimit: () =>
    get()
      .budgets.filter((b) => b.period === 'monthly')
      .reduce((s, b) => s + b.amount, 0),

  fetchBudgets: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budgets')
        .select(`*, category:categories(name, color, icon), account:accounts(name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return;
      set({ budgets: (data ?? []) as Budget[] });
    } finally {
      set({ isLoading: false });
    }
  },

  createBudget: async (input) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { error } = await supabase.from('budgets').insert({
        user_id: user.id,
        amount: input.amount,
        period: input.period,
        category_id: input.category_id ?? null,
        account_id: null,
      });

      if (error) return { success: false, error: error.message };
      await get().fetchBudgets();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  deleteBudget: async (id) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) return { success: false, error: error.message };
      await get().fetchBudgets();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
}));
