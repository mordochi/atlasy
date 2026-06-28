'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SENSITIVE_SPECIES = new Set(['bird', 'rabbit', 'squirrel', 'turtle'])

function applyFuzzyOffset(lat: number, lng: number) {
  const R = 6371000
  const dist = 200 + Math.random() * 300
  const angle = Math.random() * 2 * Math.PI
  const dLat = (dist * Math.cos(angle)) / R
  const dLng = (dist * Math.sin(angle)) / (R * Math.cos((lat * Math.PI) / 180))
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  }
}

export interface CreateAnimalPayload {
  name: string
  species_id: string
  lat: number
  lng: number
  photo_url?: string
  color?: string
  description?: string
  age?: number
  gender?: 'male' | 'female' | 'unknown'
  personality_ids?: string[]
}

export interface CreateAnimalResult {
  success: boolean
  animalId?: string
  error?: string
}

export async function createAnimal(payload: CreateAnimalPayload): Promise<CreateAnimalResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const isAdmin = (user.app_metadata as Record<string, unknown>)?.is_admin === true

  if (payload.species_id !== 'cat' && !isAdmin) {
    return { success: false, error: 'Only cats can be submitted' }
  }

  let { lat, lng } = payload
  if (SENSITIVE_SPECIES.has(payload.species_id)) {
    ;({ lat, lng } = applyFuzzyOffset(lat, lng))
  }

  const { data: animalId, error } = await supabase.rpc('create_animal_with_photo', {
    p_name: payload.name,
    p_species_id: payload.species_id,
    p_lat: lat,
    p_lng: lng,
    p_photo_url: payload.photo_url ?? null,
    p_color: payload.color || null,
    p_description: payload.description || null,
    p_age: payload.age ?? null,
    p_gender: payload.gender ?? null,
    p_personality_ids: payload.personality_ids?.length ? payload.personality_ids : null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  return { success: true, animalId: animalId as string }
}
