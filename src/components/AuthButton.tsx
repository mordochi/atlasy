'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal()
      }
    }
    if (showModal) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModal])

  function closeModal() {
    setShowModal(false)
    setEmail('')
    setMagicLinkSent(false)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    setMagicLinkSent(true)
  }

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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Sign in to Atlasy</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-gray-300 text-xs">
              <div className="flex-1 h-px bg-gray-200" />
              or
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {magicLinkSent ? (
              <div className="text-center text-sm text-gray-600 py-2">
                <p className="font-medium text-gray-800 mb-1">Check your email</p>
                <p>We sent a sign-in link to <span className="font-medium">{email}</span></p>
              </div>
            ) : (
              <form onSubmit={sendMagicLink} className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
