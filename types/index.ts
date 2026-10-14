export type PlaceType = 'restaurant' | 'hotel' | 'landmark' | 'airport';
export type BucketListType = 'country' | 'city';
export type GoalType = 'countries' | 'cities' | 'airports';

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  share_slug: string;
  is_purchased: boolean;
  created_at: string;
}

export interface VisitedCountry {
  id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  visited_at: string;
  notes: string | null;
}

export interface VisitedCity {
  id: string;
  user_id: string;
  country_code: string;
  city_name: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  visited_at: string;
}

export interface Place {
  id: string;
  user_id: string;
  city_id: string | null;
  type: PlaceType;
  name: string;
  address: string | null;
  iata_code: string | null;
  rating: number | null;
  notes: string | null;
  visited_at: string;
}

export interface BucketListItem {
  id: string;
  user_id: string;
  country_code: string | null;
  country_name: string | null;
  city_name: string | null;
  type: BucketListType;
  notes: string | null;
  created_at: string;
}

export interface CountryReview {
  id: string;
  user_id: string;
  country_code: string;
  safety: number;           // 1-5
  accommodation: number;    // 1-5
  transport: number;        // 1-5
  food: number;             // 1-5
  getting_around: number;   // 1-5
  safety_women: number;     // 1-5
  overall: number;          // 0-100, calculated average
  comment: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  year: number;
  target: number;
  type: GoalType;
}

export interface Airport {
  iata_code: string;
  name: string;
  municipality: string;
  iso_country: string;
  iso_region: string;
  latitude_deg: number;
  longitude_deg: number;
}

export interface Stats {
  countries: number;
  cities: number;
  airports: number;
  worldPercent: string;
}
