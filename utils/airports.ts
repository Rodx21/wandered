import type { Airport } from '@/types';

// airports.csv is bundled as a static asset (from ourairports.com)
// It is parsed once and cached in memory.
let _cache: Airport[] | null = null;

/**
 * Returns the full airports list from the bundled CSV.
 * Only airports with a valid IATA code are included.
 */
export function getAirports(): Airport[] {
  if (_cache) return _cache;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw: string = require('../assets/airports.csv');
    _cache = parseAirportsCsv(raw);
  } catch {
    console.warn('[Wandered] airports.csv not found — place it at assets/airports.csv');
    _cache = [];
  }

  return _cache;
}

function parseAirportsCsv(csv: string): Airport[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // OurAirports CSV header:
  // id,ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,
  // iso_region,municipality,scheduled_service,gps_code,iata_code,local_code,home_link,
  // wikipedia_link,keywords
  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  const idx = (name: string) => headers.indexOf(name);

  const airports: Airport[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const iata = cols[idx('iata_code')]?.replace(/"/g, '').trim();
    if (!iata || iata.length !== 3) continue;

    airports.push({
      iata_code: iata,
      name: cols[idx('name')]?.replace(/"/g, '').trim() ?? '',
      municipality: cols[idx('municipality')]?.replace(/"/g, '').trim() ?? '',
      iso_country: cols[idx('iso_country')]?.replace(/"/g, '').trim() ?? '',
      iso_region: cols[idx('iso_region')]?.replace(/"/g, '').trim() ?? '',
      latitude_deg: parseFloat(cols[idx('latitude_deg')] ?? '0'),
      longitude_deg: parseFloat(cols[idx('longitude_deg')] ?? '0'),
    });
  }

  return airports;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Search airports by IATA code or name/city — returns top 20 results */
export function searchAirports(query: string): Airport[] {
  const q = query.toUpperCase().trim();
  if (!q) return [];

  const all = getAirports();
  const exact = all.filter((a) => a.iata_code === q);
  if (exact.length) return exact;

  const ql = query.toLowerCase();
  return all
    .filter(
      (a) =>
        a.iata_code.includes(q) ||
        a.name.toLowerCase().includes(ql) ||
        a.municipality.toLowerCase().includes(ql),
    )
    .slice(0, 20);
}
