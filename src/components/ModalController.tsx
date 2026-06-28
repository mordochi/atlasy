'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import SignInModal from './SignInModal'
import AddAnimalModal from './AddAnimalModal'

export default function ModalController() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const showLogin = searchParams.has('login')
  const showSpotIt = searchParams.has('spot-it')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!showLogin && !showSpotIt) return null
  if (authLoading) return null

  function close() {
    router.push('?')
  }

  if (showLogin || (showSpotIt && !user)) {
    return (
      <SignInModal
        onClose={close}
        redirectAfterLogin={showSpotIt ? '/?spot-it' : undefined}
      />
    )
  }

  if (showSpotIt && user) {
    return <AddAnimalModal onClose={close} />
  }

  return null
}
