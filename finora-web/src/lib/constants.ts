import { Category } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', user_id: '', name: 'Food', icon: '🍔', color: '#F59E0B', type: 'expense', created_at: '' },
  { id: 'transport', user_id: '', name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'expense', created_at: '' },
  { id: 'shopping', user_id: '', name: 'Shopping', icon: '🛍️', color: '#8B5CF6', type: 'expense', created_at: '' },
  { id: 'bills', user_id: '', name: 'Bills', icon: '⚡', color: '#EF4444', type: 'expense', created_at: '' },
  { id: 'health', user_id: '', name: 'Health', icon: '🏥', color: '#10B981', type: 'expense', created_at: '' },
  { id: 'entertainment', user_id: '', name: 'Entertainment', icon: '🎮', color: '#EC4899', type: 'expense', created_at: '' },
  { id: 'education', user_id: '', name: 'Education', icon: '🎓', color: '#06B6D4', type: 'expense', created_at: '' },
  { id: 'other_expense', user_id: '', name: 'Other', icon: '📦', color: '#94A3B8', type: 'expense', created_at: '' },
  { id: 'salary', user_id: '', name: 'Salary', icon: '💼', color: '#10B981', type: 'income', created_at: '' },
  { id: 'freelance', user_id: '', name: 'Freelance', icon: '💻', color: '#2563EB', type: 'income', created_at: '' },
  { id: 'business', user_id: '', name: 'Business', icon: '🏢', color: '#6366F1', type: 'income', created_at: '' },
  { id: 'investment', user_id: '', name: 'Investment', icon: '📈', color: '#F59E0B', type: 'income', created_at: '' },
  { id: 'other_income', user_id: '', name: 'Other', icon: '📦', color: '#94A3B8', type: 'income', created_at: '' },
]
