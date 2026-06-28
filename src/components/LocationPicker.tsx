'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

interface Props {
  initialLat: number
  initialLng: number
  onChange: (lat: number, lng: number) => void
}

export default function LocationPicker({ initialLat, initialLng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [initialLng, initialLat],
      zoom: 14,
    })

    mapRef.current = map

    const marker = new mapboxgl.Marker({ draggable: true, color: '#fb923c' })
      .setLngLat([initialLng, initialLat])
      .addTo(map)

    onChange(initialLat, initialLng)

    marker.on('dragend', () => {
      const pos = marker.getLngLat()
      onChange(pos.lat, pos.lng)
    })

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat)
      onChange(e.lngLat.lat, e.lngLat.lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400">Click on the map or drag the pin to set location</p>
      <div ref={containerRef} className="w-full h-44 rounded-xl overflow-hidden border border-gray-200" />
    </div>
  )
}
