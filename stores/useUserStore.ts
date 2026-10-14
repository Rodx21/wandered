import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import type { User, VisitedCountry, VisitedCity, Place, BucketListItem, CountryReview } from '@/types';
import {
  fetchProfile,
  fetchVisitedCountries,
  fetchVisitedCities,
  fetchPlaces,
  fetchBucketList,
  fetchCountryReviews,
} from '@/lib/supabase';
import { TOTAL_COUNTRIES } from '@/constants';

interface UserState {
  session: Session | null;
  profile: User | null;
  visitedCountries: VisitedCountry[];
  visitedCities: VisitedCity[];
  places: Place[];
  bucketList: BucketListItem[];
  reviews: CountryReview[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: Session | null) => void;
  loadUserData: (userId: string) => Promise<void>;
  setProfile: (profile: User) => void;
  addVisitedCountry: (country: VisitedCountry) => void;
  removeVisitedCountry: (countryCode: string) => void;
  addVisitedCity: (city: VisitedCity) => void;
  addPlace: (place: Place) => void;
  addBucketListItem: (item: BucketListItem) => void;
  removeBucketListItem: (id: string) => void;
  upsertReview: (review: CountryReview) => void;
  setPurchased: (isPurchased: boolean) => void;
  reset: () => void;

  // Computed
  stats: () => {
    countries: number;
    cities: number;
    airports: number;
    worldPercent: string;
  };
}

export const useUserStore = create<UserState>((set, get) => ({
  session: null,
  profile: null,
  visitedCountries: [],
  visitedCities: [],
  places: [],
  bucketList: [],
  reviews: [],
  isLoading: false,
  error: null,

  setSession: (session) => set({ session }),

  loadUserData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const [profile, countries, cities, places, bucketList] = await Promise.all([
        fetchProfile(userId),
        fetchVisitedCountries(userId),
        fetchVisitedCities(userId),
        fetchPlaces(userId),
        fetchBucketList(userId),
      ]);

      // country_reviews table may not exist yet — load it separately so it
      // never blocks the rest of the user data from loading.
      let reviews: CountryReview[] = [];
      try {
        reviews = await fetchCountryReviews(userId);
      } catch {
        // table not yet migrated — silently ignore
      }

      set({ profile, visitedCountries: countries, visitedCities: cities, places, bucketList, reviews });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => set({ profile }),

  addVisitedCountry: (country) =>
    set((state) => ({
      visitedCountries: [
        country,
        ...state.visitedCountries.filter((c) => c.country_code !== country.country_code),
      ],
    })),

  removeVisitedCountry: (countryCode) =>
    set((state) => ({
      visitedCountries: state.visitedCountries.filter((c) => c.country_code !== countryCode),
    })),

  addVisitedCity: (city) =>
    set((state) => ({ visitedCities: [city, ...state.visitedCities] })),

  addPlace: (place) =>
    set((state) => ({ places: [place, ...state.places] })),

  addBucketListItem: (item) =>
    set((state) => ({ bucketList: [item, ...state.bucketList] })),

  removeBucketListItem: (id) =>
    set((state) => ({ bucketList: state.bucketList.filter((b) => b.id !== id) })),

  upsertReview: (review) =>
    set((state) => ({
      reviews: [
        review,
        ...state.reviews.filter((r) => r.country_code !== review.country_code),
      ],
    })),

  setPurchased: (isPurchased) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, is_purchased: isPurchased } : null,
    })),

  reset: () =>
    set({
      session: null,
      profile: null,
      visitedCountries: [],
      visitedCities: [],
      places: [],
      bucketList: [],
      reviews: [],
      isLoading: false,
      error: null,
    }),

  stats: () => {
    const { visitedCountries, visitedCities, places } = get();
    const airports = places.filter((p) => p.type === 'airport').length;
    const worldPercent = ((visitedCountries.length / TOTAL_COUNTRIES) * 100).toFixed(1);
    return {
      countries: visitedCountries.length,
      cities: visitedCities.length,
      airports,
      worldPercent,
    };
  },
}));
