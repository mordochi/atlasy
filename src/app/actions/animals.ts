'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { distanceInMeters } from '@/lib/geo'

const SENSITIVE_SPECIES = new Set(['bird', 'rabbit', 'squirrel', 'turtle'])
const SIGHTING_MAX_DISTANCE_METERS = 300

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

export async function recordSighting(
  animalId: string,
  lat: number,
  lng: number
): Promise<{ success: boolean; alreadySeen?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: animal } = await supabase
    .from('animals')
    .select('user_id, created_at, lat, lng')
    .eq('id', animalId)
    .single()

  if (!animal) return { success: false, error: 'Animal not found' }

  if (animal.user_id === user.id) {
    const today = new Date().toISOString().split('T')[0]
    const submittedDate = new Date(animal.created_at).toISOString().split('T')[0]
    if (submittedDate === today) {
      return { success: false, error: "You can't log a sighting for an animal you added today" }
    }
  }

  if (distanceInMeters(lat, lng, animal.lat, animal.lng) > SIGHTING_MAX_DISTANCE_METERS) {
    return {
      success: false,
      error: `You need to be within ${SIGHTING_MAX_DISTANCE_METERS}m of the animal to log a sighting`,
    }
  }

  const { error } = await supabase
    .from('sightings')
    .insert({ animal_id: animalId, user_id: user.id })

  if (error) {
    if (error.code === '23505') return { success: true, alreadySeen: true }
    return { success: false, error: error.message }
  }

  return { success: true }
}
