import AuthButton from './AuthButton'

export default function Header() {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
      <div className="bg-white rounded-2xl shadow-md px-4 py-2 flex items-center gap-2">
        <span className="text-2xl">🌍</span>
        <span className="font-bold text-gray-800 text-lg">Atlasy</span>
      </div>
      <div className="pointer-events-auto">
        <AuthButton />
      </div>
    </div>
  )
}
