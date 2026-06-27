# Atlasy Feature Roadmap

## Auth
- [ ] Sign up / sign in (Supabase Auth)
- [ ] Only authenticated users can add animals

## Add Animal
- [ ] Add animal form page
- [ ] Photo upload with automatic GPS extraction from EXIF, fallback to browser geolocation, fallback to manual map pin
- [ ] Fuzzy location for sensitive species (random offset 200–500m)

## Interactions
- [ ] "Seen today" button — requires login and browser geolocation; only registers a sighting if the user is within 300m of the animal's recorded location

## Sharing
- [ ] Shareable animal URLs (already have `?animal=id`)
- [ ] OG meta tags for social media previews

## Mobile
- [ ] RWD — animal panel becomes a bottom drawer on mobile
- [ ] Performance optimization
