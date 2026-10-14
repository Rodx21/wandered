import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// SecureStore adapter for Supabase auth persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig?.extra?.supabaseUrl as string);

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig?.extra?.supabaseAnonKey as string);

const isConfigured =
  supabaseUrl &&
  supabaseUrl !== 'REPLACE_WITH_YOUR_SUPABASE_URL' &&
  supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('[Wandered] Supabase not configured. Check .env EXPO_PUBLIC_SUPABASE_URL');
}

// Use a dummy URL when not configured so the client doesn't throw on init
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const slug = generateSlug(displayName);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, share_slug: slug },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

export async function upsertProfile(userId: string, displayName: string) {
  const slug = generateSlug(displayName);
  const username = slug;
  const { error } = await supabase.from('users').upsert({
    id: userId,
    username,
    display_name: displayName,
    share_slug: slug,
    is_purchased: false,
  });
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updatePurchaseStatus(userId: string, isPurchased: boolean) {
  const { error } = await supabase
    .from('users')
    .update({ is_purchased: isPurchased })
    .eq('id', userId);
  if (error) throw error;
}

// ─── Visited data helpers ─────────────────────────────────────────────────────

export async function fetchVisitedCountries(userId: string) {
  const { data, error } = await supabase
    .from('visited_countries')
    .select('*')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addVisitedCountry(
  userId: string,
  countryCode: string,
  countryName: string,
  notes?: string,
) {
  const { data, error } = await supabase
    .from('visited_countries')
    .upsert(
      {
        user_id: userId,
        country_code: countryCode,
        country_name: countryName,
        visited_at: new Date().toISOString(),
        notes: notes ?? null,
      },
      { onConflict: 'user_id,country_code' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeVisitedCountry(userId: string, countryCode: string) {
  const { error } = await supabase
    .from('visited_countries')
    .delete()
    .eq('user_id', userId)
    .eq('country_code', countryCode);
  if (error) throw error;
}

export async function fetchVisitedCities(userId: string) {
  const { data, error } = await supabase
    .from('visited_cities')
    .select('*')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addVisitedCity(
  userId: string,
  cityName: string,
  countryCode: string,
  region?: string,
  latitude?: number,
  longitude?: number,
) {
  const { data, error } = await supabase
    .from('visited_cities')
    .insert({
      user_id: userId,
      city_name: cityName,
      country_code: countryCode,
      region: region ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      visited_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPlaces(userId: string) {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addPlace(
  userId: string,
  payload: {
    city_id?: string;
    type: 'restaurant' | 'hotel' | 'landmark' | 'airport';
    name: string;
    address?: string;
    iata_code?: string;
    rating?: number;
    notes?: string;
  },
) {
  const { data, error } = await supabase
    .from('places')
    .insert({ user_id: userId, ...payload, visited_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Country reviews ─────────────────────────────────────────────────────────

export async function fetchCountryReviews(userId: string) {
  const { data, error } = await supabase
    .from('country_reviews')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertCountryReview(
  userId: string,
  countryCode: string,
  ratings: {
    safety: number;
    accommodation: number;
    transport: number;
    food: number;
    getting_around: number;
    safety_women: number;
    comment?: string;
  },
) {
  const overall = Math.round(
    ((ratings.safety + ratings.accommodation + ratings.transport +
      ratings.food + ratings.getting_around + ratings.safety_women) / 6) * 20,
  );
  const { data, error } = await supabase
    .from('country_reviews')
    .upsert(
      {
        user_id:        userId,
        country_code:   countryCode,
        safety:         ratings.safety,
        accommodation:  ratings.accommodation,
        transport:      ratings.transport,
        food:           ratings.food,
        getting_around: ratings.getting_around,
        safety_women:   ratings.safety_women,
        overall,
        comment:        ratings.comment ?? null,
      },
      { onConflict: 'user_id,country_code' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Bucket list ─────────────────────────────────────────────────────────────

export async function fetchBucketList(userId: string) {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addBucketListItem(
  userId: string,
  countryCode: string,
  countryName: string,
  notes?: string,
) {
  const { data, error } = await supabase
    .from('bucket_list')
    .upsert({
      user_id: userId,
      country_code: countryCode,
      country_name: countryName,
      type: 'country',
      notes: notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeBucketListItem(userId: string, id: string) {
  const { error } = await supabase
    .from('bucket_list')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Public profile ───────────────────────────────────────────────────────────

export async function fetchPublicProfile(slug: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, share_slug')
    .eq('share_slug', slug)
    .single();
  if (error) throw error;

  const [countries, cities] = await Promise.all([
    fetchVisitedCountries(user.id),
    fetchVisitedCities(user.id),
  ]);

  return { user, countries, cities };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
