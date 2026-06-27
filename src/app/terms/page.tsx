export default function TermsOfService() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">What Atlasy is</h2>
        <p className="text-sm leading-relaxed">
          Atlasy is a community map for spotting and sharing street animals. Users can log sightings with photos, locations, and descriptions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your responsibilities</h2>
        <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
          <li>Only submit real animal sightings with accurate locations</li>
          <li>Do not submit content that is harmful, misleading, or violates others' rights</li>
          <li>You are responsible for any content you submit</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Content ownership</h2>
        <p className="text-sm leading-relaxed">
          You retain ownership of photos and content you submit. By submitting, you grant Atlasy a license to display that content on the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Limitation of liability</h2>
        <p className="text-sm leading-relaxed">
          Atlasy is provided as-is. We are not liable for any damages arising from your use of the service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
        <p className="text-sm leading-relaxed">
          Questions? Email us at <a href="mailto:lilynnchi@gmail.com" className="text-orange-500 hover:underline">lilynnchi@gmail.com</a>
        </p>
      </section>
    </main>
  )
}
