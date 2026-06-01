import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import { Contact, PeopleBalance, PeopleBalanceWithContact, PeopleSubtype } from '@/types';

// ────────────────────────────────────────────────────────────────────────────
// Outstanding Balance Calculator
// Mirrors the web implementation exactly.
// ────────────────────────────────────────────────────────────────────────────

export function calculateOutstanding(
  rows: { type: string; subtype: string | null; amount: number }[],
  direction: 'payable' | 'receivable'
): number {
  let outstanding = 0;
  for (const row of rows) {
    const amt = typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount;
    if (direction === 'payable') {
      if (row.type === 'opening_payable') outstanding += amt;
      else if (row.type === 'payable' && row.subtype === 'borrow') outstanding += amt;
      else if (row.type === 'payable' && row.subtype === 'repay') outstanding -= amt;
      else if (row.type === 'payable' && row.subtype === 'writeoff') outstanding -= amt;
      else if (row.type === 'payable' && row.subtype === 'adjustment') outstanding += amt;
    } else {
      if (row.type === 'opening_receivable') outstanding += amt;
      else if (row.type === 'receivable' && row.subtype === 'lend') outstanding += amt;
      else if (row.type === 'receivable' && row.subtype === 'collect') outstanding -= amt;
      else if (row.type === 'receivable' && row.subtype === 'writeoff') outstanding -= amt;
      else if (row.type === 'receivable' && row.subtype === 'adjustment') outstanding += amt;
    }
  }
  return Math.max(0, outstanding);
}

// ────────────────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────────────────

interface PeopleState {
  contacts: Contact[];
  balances: PeopleBalanceWithContact[];
  isLoading: boolean;
  error: string | null;

  fetchContacts: () => Promise<void>;
  fetchBalances: () => Promise<void>;

  addContact: (name: string, type: Contact['type']) => Promise<{ success: boolean; error?: string }>;

  /**
   * Create an opening entry (balance existed before Finoraa).
   * Does NOT touch account balances.
   */
  addOpeningEntry: (
    contactId: string,
    entryType: 'opening_payable' | 'opening_receivable',
    amount: number,
    accountId: string | null,
    note: string
  ) => Promise<{ success: boolean; error?: string }>;

  /**
   * Record a live transaction (borrow/lend/repay/collect).
   * Updates account balance via a transactions row.
   */
  addPeopleTransaction: (
    contactId: string,
    subtype: PeopleSubtype,
    amount: number,
    accountId: string,
    note: string,
    transactionDate?: string
  ) => Promise<{ success: boolean; error?: string; isOverpayment?: boolean; outstanding?: number }>;

  writeOffBalance: (
    contactId: string,
    direction: 'payable' | 'receivable',
    amount: number,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;

  deleteBalance: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateBalance: (id: string, updates: Partial<PeopleBalance>) => Promise<{ success: boolean; error?: string }>;
}

function subtypeToBalanceType(subtype: PeopleSubtype): 'payable' | 'receivable' {
  switch (subtype) {
    case 'borrow':
    case 'repay':
      return 'payable';
    case 'lend':
    case 'collect':
      return 'receivable';
    default:
      return 'payable';
  }
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  contacts: [],
  balances: [],
  isLoading: false,
  error: null,

  fetchContacts: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      set({ error: error.message, isLoading: false });
    } else {
      set({ contacts: data as Contact[], isLoading: false });
    }
  },

  fetchBalances: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('people_balances')
      .select('*, contact:contacts(*)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (error) {
      set({ error: error.message, isLoading: false });
    } else {
      set({ balances: data as PeopleBalanceWithContact[], isLoading: false });
    }
  },

  addContact: async (name, type) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('contacts')
      .insert([{ user_id: user.id, name, type }])
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    set(state => ({
      contacts: [...state.contacts, data as Contact].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return { success: true };
  },

  addOpeningEntry: async (contactId, entryType, amount, accountId, note) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('people_balances')
      .insert([{
        user_id: user.id,
        contact_id: contactId,
        type: entryType,
        subtype: null,
        amount,
        account_id: accountId,
        note: note || null,
        transaction_date: new Date().toISOString().split('T')[0],
      }])
      .select('*, contact:contacts(*)')
      .single();

    if (error) return { success: false, error: error.message };

    set(state => ({ balances: [data as PeopleBalanceWithContact, ...state.balances] }));
    return { success: true };
  },

  addPeopleTransaction: async (contactId, subtype, amount, accountId, note, transactionDate) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };

    const balanceType = subtypeToBalanceType(subtype);
    const txDate = transactionDate ?? new Date().toISOString().split('T')[0];

    // Check for overpayment on repay/collect
    if (subtype === 'repay' || subtype === 'collect') {
      const { balances } = get();
      const contactBalances = balances.filter(b => b.contact_id === contactId);
      const direction = subtype === 'repay' ? 'payable' : 'receivable';
      const outstanding = calculateOutstanding(contactBalances, direction);
      if (amount > outstanding + 0.01) {
        return { success: false, error: 'Overpayment', isOverpayment: true, outstanding };
      }
    }

    // Create account transaction
    const isInflow = subtype === 'borrow' || subtype === 'collect';
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: isInflow ? 'income' : 'expense',
      amount,
      from_account_id: isInflow ? null : accountId,
      to_account_id: isInflow ? accountId : null,
      note: note || `People: ${subtype}`,
      transaction_date: txDate,
    });

    if (txError) return { success: false, error: `Account update failed: ${txError.message}` };

    // Create people_balances entry
    const { data, error } = await supabase
      .from('people_balances')
      .insert([{
        user_id: user.id,
        contact_id: contactId,
        type: balanceType,
        subtype,
        amount,
        account_id: accountId,
        note: note || null,
        transaction_date: txDate,
      }])
      .select('*, contact:contacts(*)')
      .single();

    if (error) return { success: false, error: error.message };

    set(state => ({ balances: [data as PeopleBalanceWithContact, ...state.balances] }));
    return { success: true };
  },

  writeOffBalance: async (contactId, direction, amount, note) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('people_balances')
      .insert([{
        user_id: user.id,
        contact_id: contactId,
        type: direction,
        subtype: 'writeoff',
        amount,
        account_id: null,
        note: note ?? 'Debt written off / forgiven',
        transaction_date: new Date().toISOString().split('T')[0],
      }])
      .select('*, contact:contacts(*)')
      .single();

    if (error) return { success: false, error: error.message };

    set(state => ({ balances: [data as PeopleBalanceWithContact, ...state.balances] }));
    return { success: true };
  },

  deleteBalance: async (id: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('people_balances')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };

    set(state => ({ balances: state.balances.filter(b => b.id !== id) }));
    return { success: true };
  },

  updateBalance: async (id: string, updates) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error, data } = await supabase
      .from('people_balances')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, contact:contacts(*)')
      .single();

    if (error) return { success: false, error: error.message };

    set(state => ({
      balances: state.balances.map(b => b.id === id ? data as PeopleBalanceWithContact : b),
    }));
    return { success: true };
  },
}));
