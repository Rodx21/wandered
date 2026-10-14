import { COUNTRIES } from '@/data/countries';
import { countryNamesPt } from '@/data/countryNamesPt';

const localizedNames: Record<string, Record<string, string>> = {
  pt: countryNamesPt,
};

/** Returns the country name in the current language, falling back to the English name. */
export function getLocalizedCountryName(code: string, language: string): string {
  const map = localizedNames[language];
  if (map?.[code]) return map[code];
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
