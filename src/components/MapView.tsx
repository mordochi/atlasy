'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import AnimalPanel from '@/components/AnimalPanel'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function MapView() {
  return (
    <div className="relative w-full h-full">
      <Map />
      <Suspense>
        <AnimalPanel />
      </Suspense>
    </div>
  )
}
