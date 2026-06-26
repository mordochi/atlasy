import MapView from '@/components/MapView'
import Header from '@/components/Header'
import SpotButton from '@/components/SpotButton'

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <Header />
      <MapView />
      <SpotButton />
    </div>
  )
}
