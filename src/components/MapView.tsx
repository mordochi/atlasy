'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import AnimalPanel from '@/components/AnimalPanel'
import type { Animal } from '@/types'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function MapView() {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)

  const handleAnimalSelect = useCallback((animal: Animal) => {
    setSelectedAnimal(animal)
  }, [])

  return (
    <div className="relative w-full h-full">
      <Map onAnimalSelect={handleAnimalSelect} />

      <AnimalPanel
        animal={selectedAnimal}
        onClose={() => setSelectedAnimal(null)}
      />
    </div>
  )
}
