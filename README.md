# Wandered

A travel journal on a world map. Tap countries you've visited, add the cities and
places you went to, keep a bucket list, review each country and share a
"passport" card of your travels. Built with React Native + Expo and backed by
Supabase.

## Features

- **Interactive world map** — tap, pinch and double-tap; countries coloured as visited / bucket list / not visited, with progress (countries, % of the world, cities)
- **Countries & cities** — searchable list of visited countries, cities and places per country
- **Bucket list** of future destinations
- **Country reviews** — overall rating plus categories (safety, accommodation, transport, food, getting around, safety for women) and a comment
- **Goals** — targets for new countries, cities and airports (bundled airports dataset)
- **Passport card** — a shareable image of your travel stats, captured with `react-native-view-shot` and shared through the native share sheet
- **Public share page** (`/share/[slug]`)
- **Auth** — email sign-up / login with Supabase Auth
- **Bilingual** — English and Portuguese
- **Subscriptions** — RevenueCat integration and a paywall component (`PurchaseGate`), currently switched off

## Tech stack

| | |
|---|---|
| App | React Native, Expo, Expo Router (typed routes), TypeScript |
| Styling | NativeWind (Tailwind for React Native), Reanimated, react-native-svg |
| State | Zustand, AsyncStorage |
| Backend | Supabase — Postgres schema with row-level security on every table (`sql/schema.sql`), Auth |
| Payments | RevenueCat (`react-native-purchases`) |
| Map data | world-atlas + topojson-client, pre-generated SVG paths (`scripts/generateWorldPaths.js`) |

## Project structure

```
app/          (auth) login/signup · (app) map, countries, bucket list, passport, profile · share/[slug]
components/   WorldMap, country / review / place sheets, PurchaseGate
stores/       Zustand stores (user, map, settings)
lib/          Supabase client, RevenueCat, i18n, date and country helpers
data/         country list, PT names, world SVG paths
sql/          Supabase schema + RLS policies
```

## Running locally

```bash
npm install
cp .env.example .env     # Supabase URL + anon key, RevenueCat keys (optional)
npx expo start
```

Create the database by running `sql/schema.sql` in the Supabase SQL editor.
