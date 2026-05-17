import { createServerClient } from '@supabase/ssr'

/**
 * Creates a Supabase client specifically for API routes (mobile app consumers).
 * Mobile apps will send their JWT token via the 'Authorization: Bearer <token>' header.
 * We pass this header directly to the Supabase client.
 */
export function createApiClient(req: Request) {
  const authHeader = req.headers.get('Authorization')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {}
      },
      global: {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    }
  )
}
