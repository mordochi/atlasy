'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import SignInModal from './SignInModal'

export default function AuthButton() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase.auth])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (user) {
    return (
      <div className="bg-white rounded-2xl shadow-md px-4 py-2 flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block truncate max-w-40">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 transition-colors px-4 py-1.5 rounded-full"
      >
        Sign in
      </button>
      {showModal && <SignInModal onClose={() => setShowModal(false)} />}
    </>
  )
}
