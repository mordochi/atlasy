# Atlasy Feature Roadmap

## Auth
- [x] Sign up / sign in — Google OAuth + Magic Link; Apple Login hidden pending Apple Developer setup
- [x] Only authenticated users can add animals (UI — DB RLS already enforces this)

## Add Animal
- [x] Add animal form page
- [x] Photo upload with automatic GPS extraction from EXIF, fallback to browser geolocation, fallback to manual map pin
- [x] Fuzzy location for sensitive species (random offset 200–500m)

### Species Restriction (Production)
- [x] In production, all users can only submit `species_id = 'cat'` via the frontend form
- [x] Admin override: set `app_metadata: { "is_admin": true }` on the user via Supabase Dashboard — no migration or redeployment needed
- [x] Enforced in the server action: if `species_id !== 'cat'` and `user.app_metadata.is_admin` is not true, reject with an error (do not silently override the value)
- [x] Frontend may reflect the restriction (hide non-cat options for non-admins), but the server action is the authoritative check

## Mobile
- [ ] RWD — animal panel becomes a bottom drawer on mobile
- [ ] Performance optimization
- [ ] Fix Spot Animal button hidden behind mobile browser toolbar — use `100dvh` instead of `h-screen` and adjust `bottom` offset

## Map
- [ ] Show user's current location on map — add blue dot marker when Locate Me is clicked (or use Mapbox GeolocateControl)
- [ ] Filter visible species via `NEXT_PUBLIC_ALLOWED_SPECIES` env var (comma-separated, e.g. `cat`); if unset, all species are shown

## Interactions
- [ ] "Seen today" button — requires login and browser geolocation; only registers a sighting if the user is within 300m of the animal's recorded location

## Sharing
- [ ] Shareable animal URLs (already have `?animal=id`)
- [ ] OG meta tags for social media previews

## Observability
- [ ] Analytics: PostHog — pageviews, custom events (e.g. "Spot an animal" clicked, animal panel opened), funnel analysis, heatmaps, session replay
- [ ] Crash reporting: Sentry — capture client and server errors with Next.js SDK and sourcemap upload
