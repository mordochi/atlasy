export interface Species {
  id: string
  name_en: string
  emoji: string
}

export interface Personality {
  id: string
  name_en: string
  emoji: string
}

export interface AnimalPhoto {
  id: string
  animal_id: string
  url: string
  thumbnail_url: string
  is_primary: boolean
  created_at: string
}

export interface Animal {
  id: string
  user_id: string
  name: string
  species_id: string
  species?: Species
  lat: number
  lng: number
  thumbnail_url: string | null
  color: string | null
  personality_ids: string[] | null
  description: string | null
  age: number | null
  gender: 'male' | 'female' | 'unknown' | null
  status: 'active' | 'flagged' | 'merged'
  created_at: string
}
