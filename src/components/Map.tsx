'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { createClient } from '@/lib/supabase/client'
import type { Animal } from '@/types'

export default function Map({ onAnimalSelect }: { onAnimalSelect: (animal: Animal) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [121.5654, 25.033],
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
          onAnimalSelect(animal)
        })
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onAnimalSelect])

  return <div ref={mapContainer} className="w-full h-full" />
}
