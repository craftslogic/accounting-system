import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Fund, FundWithStats, FundTransaction, FundTransactionType } from '@/types';

interface FundStore {
  funds: FundWithStats[];
  transactions: FundTransaction[];
  isLoading: boolean;
  error: string | null;

  fetchFunds: () => Promise<void>;
  fetchFundTransactions: (fundId: string) => Promise<FundTransaction[]>;

  createFund: (input: CreateFundInput) => Promise<{ success: boolean; error?: string }>;
  addFundTransaction: (input: AddFundTransactionInput) => Promise<{ success: boolean; error?: string }>;

  // Derived: total reserved from all funds (for balance card)
  getTotalReserved: () => number;
}

export interface CreateFundInput {
  name: string;
  type: string;
  target_amount?: number;
  color: string;
  icon: string;
  description?: string;
  initial_balance?: number;
}

export interface AddFundTransactionInput {
  fund_id: string;
  account_id?: string;
  type: FundTransactionType;
  amount: number;
  note?: string;
  transaction_date: string;
}

export const useFundStore = create<FundStore>((set, get) => ({
  funds: [],
  transactions: [],
  isLoading: false,
  error: null,

  getTotalReserved: () =>
    get().funds.reduce((sum, f) => sum + (f.current_amount ?? 0), 0),

  fetchFunds: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) { set({ error: error.message }); return; }

      const fundsWithStats: FundWithStats[] = (data ?? []).map((f: any) => {
        const current = parseFloat(String(f.current_amount ?? 0));
        const target = f.target_amount ? parseFloat(String(f.target_amount)) : null;
        const pct = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const remaining = target !== null ? Math.max(0, target - current) : null;
        return {
          id: f.id,
          user_id: f.user_id,
          name: f.name,
          type: f.type,
          target_amount: target,
          current_amount: current,
          color: f.color ?? '#208AEF',
          icon: f.icon ?? 'wallet-outline',
          description: f.description ?? null,
          is_archived: f.is_archived,
          created_at: f.created_at,
          progress_percentage: pct,
          remaining_amount: remaining,
        };
      });

      set({ funds: fundsWithStats });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFundTransactions: async (fundId) => {
    try {
      const { data, error } = await supabase
        .from('fund_transactions')
        .select('*')
        .eq('fund_id', fundId)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) return [];
      return (data ?? []) as FundTransaction[];
    } catch {
      return [];
    }
  },

  createFund: async (input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { data: newFund, error } = await supabase.from('funds').insert({
        user_id: user.id,
        name: input.name,
        type: input.type,
        target_amount: input.target_amount ?? null,
        current_amount: input.initial_balance ?? 0,
        color: input.color,
        icon: input.icon,
        description: input.description ?? null,
      }).select('id').single();

      if (error) return { success: false, error: error.message };

      if (input.initial_balance && input.initial_balance > 0 && newFund?.id) {
        await supabase.from('fund_transactions').insert({
          user_id: user.id,
          fund_id: newFund.id,
          type: 'opening_balance',
          amount: input.initial_balance,
          note: 'Opening balance',
          transaction_date: new Date().toISOString().split('T')[0],
        });
      }

      await get().fetchFunds();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  addFundTransaction: async (input) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not logged in' };

      const { error: txError } = await supabase.from('fund_transactions').insert({
        user_id: user.id,
        fund_id: input.fund_id,
        account_id: input.account_id ?? null,
        type: input.type,
        amount: input.amount,
        note: input.note ?? null,
        transaction_date: input.transaction_date,
      });

      if (txError) return { success: false, error: txError.message };

      // Update fund current_amount in DB
      const fund = get().funds.find(f => f.id === input.fund_id);
      if (fund) {
        const delta = input.type === 'withdraw' ? -input.amount : input.amount;
        const newAmount = Math.max(0, fund.current_amount + delta);

        await supabase
          .from('funds')
          .update({ current_amount: newAmount })
          .eq('id', input.fund_id);
      }

      await get().fetchFunds();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
}));
