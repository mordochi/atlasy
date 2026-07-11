'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import { createClient } from '@/lib/supabase/client'

const FALLBACK_CENTER: [number, number] = [121.5654, 25.033]

const BASE_MARKER_ZOOM = 13
const MIN_MARKER_SCALE = 1
const MAX_MARKER_SCALE = 2

function getMarkerScale(zoom: number): number {
  const scale = 1 + (zoom - BASE_MARKER_ZOOM) * 0.25
  return Math.min(MAX_MARKER_SCALE, Math.max(MIN_MARKER_SCALE, scale))
}

function applyMarkerScale(el: HTMLElement, zoom: number) {
  el.style.transform = `scale(${getMarkerScale(zoom)})`
}

interface MarkerParts {
  // Passed to `new mapboxgl.Marker({ element: root })` — Mapbox writes its
  // own positioning transform onto this element on every move/zoom.
  root: HTMLElement
  // Scaled on zoom instead of `root`, since writing `transform` on `root`
  // would fight with Mapbox's positioning transform and get overwritten.
  scaleTarget: HTMLElement
}

function createMarkerElement(
  name: string,
  emoji: string,
  thumbnailUrl?: string | null
): MarkerParts {
  const root = document.createElement('div')
  root.className = 'cursor-pointer select-none'
  root.title = name

  const scaleTarget = document.createElement('div')
  scaleTarget.className = 'flex flex-col items-center'
  scaleTarget.style.transformOrigin = 'bottom center'

  // Pointer sits behind the photo (lower z-index) so only its tip peeks
  // out below the circle instead of covering part of the photo.
  const pointer = document.createElement('div')
  pointer.className = 'relative z-0 w-3 h-3 -mt-1.5 bg-white rotate-45 shadow-md'

  const photo = document.createElement('div')
  photo.className =
    'relative z-10 w-11 h-11 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center'

  if (thumbnailUrl) {
    const img = document.createElement('img')
    img.src = thumbnailUrl
    img.alt = name
    img.className = 'w-full h-full object-cover'
    photo.appendChild(img)
  } else {
    photo.classList.add('text-lg')
    photo.textContent = emoji
  }

  scaleTarget.appendChild(photo)
  scaleTarget.appendChild(pointer)
  root.appendChild(scaleTarget)

  return { root, scaleTarget }
}

function getInitialCenter(): Promise<[number, number]> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(FALLBACK_CENTER)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      () => resolve(FALLBACK_CENTER)
    )
  })
}

export default function Map() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerElsRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    let cancelled = false

    getInitialCenter().then((center) => {
      if (cancelled || !mapContainer.current) return

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom: 13,
      })

      mapRef.current = map

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

      map.on('zoom', () => {
        const zoom = map.getZoom()
        markerElsRef.current.forEach((el) => applyMarkerScale(el, zoom))
      })

      map.on('load', async () => {
        const supabase = createClient()
        const { data: animals } = await supabase
          .from('animals')
          .select('*, species:species_id(id, name_en, emoji)')

        if (!animals) return

        animals.forEach((animal) => {
          const { root, scaleTarget } = createMarkerElement(
            animal.name,
            animal.species?.emoji ?? '🐾',
            animal.thumbnail_url
          )
          applyMarkerScale(scaleTarget, map.getZoom())
          markerElsRef.current.push(scaleTarget)

          new mapboxgl.Marker({ element: root, anchor: 'bottom' })
            .setLngLat([animal.lng, animal.lat])
            .addTo(map)

          root.addEventListener('click', (e) => {
            e.stopPropagation()
            router.push(`?animal=${animal.id}`)
          })
        })
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerElsRef.current = []
    }
  }, [router])

  useEffect(() => {
    function handleAnimalAdded(e: Event) {
      const map = mapRef.current
      if (!map) return
      const { id, name, lat, lng, species, thumbnail_url } = (e as CustomEvent).detail

      const { root, scaleTarget } = createMarkerElement(name, species?.emoji ?? '🐾', thumbnail_url)
      applyMarkerScale(scaleTarget, map.getZoom())
      markerElsRef.current.push(scaleTarget)

      new mapboxgl.Marker({ element: root, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map)

      root.addEventListener('click', (evt) => {
        evt.stopPropagation()
        router.push(`?animal=${id}`)
      })
    }

    window.addEventListener('atlasy:animal-added', handleAnimalAdded)
    return () => window.removeEventListener('atlasy:animal-added', handleAnimalAdded)
  }, [router])

  function locateMe() {
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 15,
      })
    })
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <button
        onClick={locateMe}
        className="absolute bottom-16 left-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl cursor-pointer"
        title="定位到我的位置"
      >
        ◎
      </button>
    </div>
  )
}
