export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">What we collect</h2>
        <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
          <li>Email address — when you sign in via Google or Magic Link</li>
          <li>Animal spotting data — name, species, location, photos, and descriptions you submit</li>
          <li>Approximate location — when you use the "Locate Me" feature (browser geolocation, not stored)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">How we use it</h2>
        <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
          <li>To identify your account and associate your submissions with it</li>
          <li>To display animal sightings on the map</li>
          <li>We do not sell your data or use it for advertising</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Third-party services</h2>
        <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
          <li><strong>Supabase</strong> — database and authentication</li>
          <li><strong>Mapbox</strong> — map rendering</li>
          <li><strong>Google Sign-In</strong> — optional OAuth login</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Data retention</h2>
        <p className="text-sm leading-relaxed">
          Your account and submitted data are retained until you request deletion.
          To delete your account, contact us at the email below.
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
