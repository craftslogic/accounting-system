import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from './CategoriesClient'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Categories' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('type')
    .order('name')

  const cats = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES

  return <CategoriesClient categories={cats} />
}
