'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Category } from '@/types'

const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  icon: z.string().min(1, 'Icon is required'),
})

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function createCategoryAction(
  _prevState: ActionResult<Category>,
  formData: FormData
): Promise<ActionResult<Category>> {
  const result = CategorySchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  })

  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  try {
    const { supabase, user } = await getCurrentUser()

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/categories')
    revalidatePath('/transactions')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateCategoryAction(
  id: string,
  _prevState: ActionResult<Category>,
  formData: FormData
): Promise<ActionResult<Category>> {
  const result = CategorySchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  })

  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  try {
    const { supabase, user } = await getCurrentUser()

    const { data, error } = await supabase
      .from('categories')
      .update(result.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/categories')
    revalidatePath('/transactions')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser()

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/categories')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getCategories() {
  const { supabase, user } = await getCurrentUser()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data
}
