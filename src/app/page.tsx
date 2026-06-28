import { Suspense } from 'react'
import MapView from '@/components/MapView'
import Header from '@/components/Header'
import SpotButton from '@/components/SpotButton'
import ModalController from '@/components/ModalController'

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <Header />
      <MapView />
      <SpotButton />
      <Suspense>
        <ModalController />
      </Suspense>
    </div>
  )
}
