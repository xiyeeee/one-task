'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
      }
    }

    checkUser()
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome</h1>
    </main>
  )
}
