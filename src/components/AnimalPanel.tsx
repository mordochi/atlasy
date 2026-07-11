'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { recordSighting } from '@/app/actions/animals'
import SignInModal from './SignInModal'
import type { Animal } from '@/types'
import type { User } from '@supabase/supabase-js'

const GENDER_LABEL = {
  male: '♂ Male',
  female: '♀ Female',
  unknown: '? Unknown',
}

const GENDER_PRONOUN = {
  male: 'him',
  female: 'her',
  unknown: 'them',
}

export default function AnimalPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animalId = searchParams.get('animal')
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [seenToday, setSeenToday] = useState(false)
  const [sightingLoading, setSightingLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!animalId) return

    setAnimal(null)
    setSeenToday(false)

    const supabase = createClient()

    supabase
      .from('animals')
      .select('*, species:species_id(id, name_en, emoji)')
      .eq('id', animalId)
      .single()
      .then(({ data }) => { if (data) setAnimal(data) })

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      supabase
        .from('sightings')
        .select('id')
        .eq('animal_id', animalId)
        .eq('user_id', user.id)
        .eq('seen_date', today)
        .maybeSingle()
        .then(({ data }) => { if (data) setSeenToday(true) })
    })
  }, [animalId])

  async function handleSeenToday() {
    if (!animal || seenToday || sightingLoading || isOwnSubmissionToday) return
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setSightingLoading(true)
    const result = await recordSighting(animal.id)
    if (result.success) setSeenToday(true)
    setSightingLoading(false)
  }

  if (!animalId || !animal) return null

  const pronoun = GENDER_PRONOUN[animal.gender ?? 'unknown']
  const currentUrl = `/?animal=${animalId}`

  const isOwnSubmissionToday =
    !!user &&
    user.id === animal.user_id &&
    new Date(animal.created_at).toISOString().split('T')[0] ===
      new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-10 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{animal.species?.emoji ?? '🐾'}</span>
            <h2 className="text-lg font-semibold text-gray-800">{animal.name}</h2>
          </div>
          <button
            onClick={() => router.push('?')}
            className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Photo */}
          {animal.thumbnail_url ? (
            <Image
              src={animal.thumbnail_url}
              alt={animal.name}
              width={320}
              height={208}
              className="w-full h-52 object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-52 bg-gray-100 rounded-xl flex items-center justify-center text-5xl">
              {animal.species?.emoji ?? '🐾'}
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {animal.species && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {animal.species.name_en}
              </span>
            )}
            {animal.gender && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {GENDER_LABEL[animal.gender]}
              </span>
            )}
            {animal.age != null && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {animal.age} yr
              </span>
            )}
            {animal.color && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {animal.color}
              </span>
            )}
            {animal.status === 'flagged' && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                ⚑ Flagged
              </span>
            )}
          </div>

          {/* Personalities */}
          {animal.personality_ids && animal.personality_ids.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {animal.personality_ids.map((p) => (
                <span key={p} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {animal.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{animal.description}</p>
          )}

          {/* Footer */}
          <p className="text-gray-400 text-xs">
            Spotted on {new Date(animal.created_at).toLocaleDateString()}
          </p>

          {/* Seen today button */}
          <button
            onClick={handleSeenToday}
            disabled={seenToday || sightingLoading || isOwnSubmissionToday}
            className="w-full py-2 bg-orange-400 hover:bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            {seenToday
              ? `✓ Seen ${pronoun} today`
              : sightingLoading
              ? 'Saving…'
              : isOwnSubmissionToday
              ? '🎉 Added by you today'
              : `👀 I saw ${pronoun} today!`}
          </button>
        </div>
      </div>

      {showLoginModal && (
        <SignInModal
          onClose={() => setShowLoginModal(false)}
          redirectAfterLogin={currentUrl}
        />
      )}
    </>
  )
}
