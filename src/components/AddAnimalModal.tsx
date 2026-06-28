'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { createAnimal } from '@/app/actions/animals'
import type { Species, Personality } from '@/types'
import type { User } from '@supabase/supabase-js'

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false })

type LocationSource = 'exif' | 'geolocation' | 'manual'

interface Props {
  onClose: () => void
}

export default function AddAnimalModal({ onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [personalityList, setPersonalityList] = useState<Personality[]>([])

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoStorageUrl, setPhotoStorageUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Location
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [speciesId, setSpeciesId] = useState('cat')
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([])
  const [gender, setGender] = useState<'' | 'male' | 'female' | 'unknown'>('')
  const [age, setAge] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState('')

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setIsAdmin((data.user?.app_metadata as Record<string, unknown>)?.is_admin === true)
    })

    Promise.all([
      supabase.from('species').select('*'),
      supabase.from('personalities').select('*'),
    ]).then(([{ data: species }, { data: personalities }]) => {
      if (species) setSpeciesList(species)
      if (personalities) setPersonalityList(personalities)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  async function extractExifGps(file: File): Promise<{ lat: number; lng: number } | null> {
    try {
      const exifr = (await import('exifr')).default
      const gps = await exifr.gps(file)
      if (gps?.latitude != null && gps?.longitude != null) {
        return { lat: gps.latitude, lng: gps.longitude }
      }
    } catch {}
    return null
  }

  async function tryGeolocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 6000 }
      )
    })
  }

  async function handlePhotoSelect(file: File) {
    setPhotoError(null)
    setPhotoPreview(URL.createObjectURL(file))

    const exifGps = await extractExifGps(file)
    if (exifGps) {
      setLat(exifGps.lat)
      setLng(exifGps.lng)
      setLocationSource('exif')
      setShowLocationPicker(false)
    } else {
      setLocationLoading(true)
      const geoPos = await tryGeolocation()
      setLocationLoading(false)
      if (geoPos) {
        setLat(geoPos.lat)
        setLng(geoPos.lng)
        setLocationSource('geolocation')
        setShowLocationPicker(false)
      } else {
        setShowLocationPicker(true)
      }
    }

    setPhotoUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('animal-photos')
        .upload(path, compressed, { contentType: file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('animal-photos').getPublicUrl(path)
      setPhotoStorageUrl(publicUrl)
    } catch {
      setPhotoError('Photo upload failed — you can still submit without a photo.')
      setPhotoPreview(null)
    } finally {
      setPhotoUploading(false)
    }
  }

  async function requestGeolocation() {
    setLocationLoading(true)
    const pos = await tryGeolocation()
    setLocationLoading(false)
    if (pos) {
      setLat(pos.lat)
      setLng(pos.lng)
      setLocationSource('geolocation')
      setShowLocationPicker(false)
    } else {
      setShowLocationPicker(true)
    }
  }

  function togglePersonality(id: string) {
    setSelectedPersonalities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || lat === null || lng === null || photoUploading) return

    setSubmitting(true)
    setError(null)

    const result = await createAnimal({
      name: name.trim(),
      species_id: speciesId,
      lat,
      lng,
      photo_url: photoStorageUrl ?? undefined,
      color: color.trim() || undefined,
      description: description.trim() || undefined,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      personality_ids: selectedPersonalities.length ? selectedPersonalities : undefined,
    })

    if (result.success && result.animalId) {
      const species = speciesList.find((s) => s.id === speciesId)
      window.dispatchEvent(
        new CustomEvent('atlasy:animal-added', {
          detail: { id: result.animalId, name: name.trim(), lat, lng, species },
        })
      )
      // Navigate to the new animal — ?spot-it is cleared, so ModalController unmounts this modal
      router.push(`?animal=${result.animalId}`)
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const locationLabel: Record<LocationSource, string> = {
    exif: '📍 From photo',
    geolocation: '📍 Current location',
    manual: '📍 Pin set',
  }

  const canSubmit = name.trim() && lat !== null && lng !== null && !photoUploading && !submitting

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Spot an animal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-5">
          {/* Photo upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handlePhotoSelect(file)
              }}
            />
            {photoPreview ? (
              <div className="relative">
                <Image
                  src={photoPreview}
                  alt="Preview"
                  width={480}
                  height={240}
                  className="w-full h-48 object-cover rounded-xl"
                />
                {photoUploading && (
                  <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center text-sm text-gray-600">
                    Uploading…
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-white text-xs text-gray-600 px-2 py-1 rounded-lg shadow"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors"
              >
                <span className="text-2xl">📷</span>
                <span className="text-sm">Add a photo</span>
              </button>
            )}
            {photoError && <p className="text-xs text-amber-600 mt-1">{photoError}</p>}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location <span className="text-red-400">*</span></label>
            {locationSource && !showLocationPicker ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{locationLabel[locationSource]}</span>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="text-xs text-orange-500 hover:text-orange-600"
                >
                  Change
                </button>
              </div>
            ) : locationLoading ? (
              <p className="text-sm text-gray-400">Detecting location…</p>
            ) : showLocationPicker ? (
              <LocationPicker
                initialLat={lat ?? 25.033}
                initialLng={lng ?? 121.5654}
                onChange={(newLat, newLng) => {
                  setLat(newLat)
                  setLng(newLng)
                  setLocationSource('manual')
                }}
              />
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={requestGeolocation}
                  className="flex-1 text-sm border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition-colors"
                >
                  Use my location
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="flex-1 text-sm border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition-colors"
                >
                  Pin on map
                </button>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="What do you call this animal?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Species — only shown to admins since non-admins can only submit cats */}
          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Species</label>
              <select
                value={speciesId}
                onChange={(e) => setSpeciesId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                {speciesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name_en}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Personality */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Personality</label>
            <div className="flex flex-wrap gap-1.5">
              {personalityList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePersonality(p.id)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    selectedPersonalities.includes(p.id)
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.emoji} {p.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <div className="flex gap-2">
              {(['male', 'female', 'unknown'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? '' : g)}
                  className={`flex-1 text-sm py-2 rounded-xl border transition-colors ${
                    gender === g
                      ? 'bg-orange-400 text-white border-orange-400'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '? Unknown'}
                </button>
              ))}
            </div>
          </div>

          {/* Age & Color */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Age (yrs)</label>
              <input
                type="number"
                min="0"
                max="30"
                placeholder="e.g. 3"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <input
                type="text"
                placeholder="e.g. orange tabby"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              placeholder="Any notes about this animal?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-medium transition-colors"
          >
            {submitting ? 'Saving…' : photoUploading ? 'Uploading photo…' : 'Spot this animal'}
          </button>
        </form>
      </div>
    </div>
  )
}
