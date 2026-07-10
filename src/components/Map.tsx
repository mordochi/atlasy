'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import { createClient } from '@/lib/supabase/client'

const FALLBACK_CENTER: [number, number] = [121.5654, 25.033]

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

      map.on('load', async () => {
        const supabase = createClient()
        const { data: animals } = await supabase
          .from('animals')
          .select('*, species:species_id(id, name_en, emoji)')

        if (!animals) return

        animals.forEach((animal) => {
          const el = document.createElement('div')
          el.className = 'cursor-pointer text-2xl select-none drop-shadow'
          el.textContent = animal.species?.emoji ?? '🐾'
          el.title = animal.name

          new mapboxgl.Marker({ element: el })
            .setLngLat([animal.lng, animal.lat])
            .addTo(map)

          el.addEventListener('click', (e) => {
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
    }
  }, [router])

  useEffect(() => {
    function handleAnimalAdded(e: Event) {
      const map = mapRef.current
      if (!map) return
      const { id, name, lat, lng, species } = (e as CustomEvent).detail

      const el = document.createElement('div')
      el.className = 'cursor-pointer text-2xl select-none drop-shadow'
      el.textContent = species?.emoji ?? '🐾'
      el.title = name

      new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)

      el.addEventListener('click', (evt) => {
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
