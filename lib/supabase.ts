'use client'

import { createClient } from '@supabase/supabase-js'

let cachedClient: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to your runtime environment (e.g. Vercel Project Settings → Environment Variables).',
    )
  }

  cachedClient = createClient(url, anonKey)
  return cachedClient
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return (getSupabaseClient() as any)[prop]
    },
  },
) as ReturnType<typeof createClient>
