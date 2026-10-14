export const TOTAL_COUNTRIES = 195;
export const EARLY_PRICE_EUR = 2.99;
export const STANDARD_PRICE_EUR = 4.99;
export const EARLY_ACCESS_LIMIT = 500;

export const REVENUECAT_ENTITLEMENT = 'full_access';
export const REVENUECAT_PRODUCT_EARLY = 'wandered_early_299';
export const REVENUECAT_PRODUCT_STANDARD = 'wandered_standard_499';

/** Fallback English labels — use t('continent_XX') in UI components instead. */
export const CONTINENT_LABELS: Record<string, string> = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};

// How many countries per continent (for stats bars)
export const CONTINENT_COUNTRY_COUNTS: Record<string, number> = {
  AF: 54,
  AN: 0,
  AS: 48,
  EU: 44,
  NA: 23,
  OC: 14,
  SA: 12,
};
