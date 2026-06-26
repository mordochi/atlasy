'use client'

import type { Animal } from '@/types'

const GENDER_LABEL = {
  male: '♂ Male',
  female: '♀ Female',
  unknown: '? Unknown',
}

export default function AnimalPanel({
  animal,
  onClose,
}: {
  animal: Animal | null
  onClose: () => void
}) {
  if (!animal) return null

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-10 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{animal.species?.emoji ?? '🐾'}</span>
          <h2 className="text-lg font-semibold text-gray-800">{animal.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Photo */}
        {animal.thumbnail_url ? (
          <img
            src={animal.thumbnail_url}
            alt={animal.name}
            className="w-full h-52 object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-52 bg-gray-100 rounded-xl flex items-center justify-center text-5xl">
            {animal.species?.emoji ?? '🐾'}
          </div>
        )}

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {animal.species && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              {animal.species.name_en}
            </span>
          )}
          {animal.gender && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {GENDER_LABEL[animal.gender]}
            </span>
          )}
          {animal.age != null && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {animal.age} yr
            </span>
          )}
          {animal.color && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {animal.color}
            </span>
          )}
          {animal.status === 'flagged' && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              ⚑ Flagged
            </span>
          )}
        </div>

        {/* Personalities */}
        {animal.personality_ids && animal.personality_ids.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {animal.personality_ids.map((p) => (
              <span key={p} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {animal.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{animal.description}</p>
        )}

        {/* Footer */}
        <p className="text-gray-400 text-xs">
          Spotted on {new Date(animal.created_at).toLocaleDateString()}
        </p>

        {/* Seen today button */}
        <button className="w-full py-2 bg-orange-400 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors">
          👀 I saw this today!
        </button>
      </div>
    </div>
  )
}
