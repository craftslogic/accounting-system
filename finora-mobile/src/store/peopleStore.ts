import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import { Contact, PeopleBalance, PeopleBalanceWithContact } from '@/types';

interface PeopleState {
  contacts: Contact[];
  balances: PeopleBalanceWithContact[];
  isLoading: boolean;
  error: string | null;
  
  fetchContacts: () => Promise<void>;
  fetchBalances: () => Promise<void>;
  addContact: (name: string, type: Contact['type']) => Promise<{ success: boolean; error?: string }>;
  addBalance: (contactId: string, type: 'payable' | 'receivable', amount: number, note: string) => Promise<{ success: boolean; error?: string }>;
  clearBalances: (contactId: string) => Promise<{ success: boolean; error?: string }>;
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
      contacts: [...state.contacts, data as Contact].sort((a, b) => a.name.localeCompare(b.name)) 
    }));
    return { success: true };
  },

  addBalance: async (contactId, type, amount, note) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };
    
    const { data, error } = await supabase
      .from('people_balances')
      .insert([{ 
        user_id: user.id, 
        contact_id: contactId, 
        type, 
        amount, 
        note: note || null,
        transaction_date: new Date().toISOString()
      }])
      .select('*, contact:contacts(*)')
      .single();
      
    if (error) return { success: false, error: error.message };
    
    set(state => ({ balances: [data as PeopleBalanceWithContact, ...state.balances] }));
    return { success: true };
  },

  clearBalances: async (contactId) => {
    const { user } = useAuthStore.getState();
    if (!user) return { success: false, error: 'Not authenticated' };
    
    const { error } = await supabase
      .from('people_balances')
      .delete()
      .eq('user_id', user.id)
      .eq('contact_id', contactId);
      
    if (error) return { success: false, error: error.message };
    
    set(state => ({
      balances: state.balances.filter(b => b.contact_id !== contactId)
    }));
    return { success: true };
  }
}));
