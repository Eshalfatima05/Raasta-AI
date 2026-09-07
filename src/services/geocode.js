// Blue Area, Islamabad bounding box — keeps geocoding results local to our demo area
const BLUE_AREA_VIEWBOX = '73.038,33.725,73.075,33.695'; // left,top,right,bottom
const BLUE_AREA_CENTER = { lat: 33.7086, lon: 73.0563 };

// Curated Blue Area / near-Blue-Area destinations. An unbounded Nominatim
// query can resolve halfway across the world for an ambiguous name like
// "Convention Center" (this happened during testing) — these known spots are
// matched first, with coordinates verified against independent sources
// (Wikipedia, GeoNames/Mapcarta), so the demo never depends on a live
// geocoder guessing right.
const CURATED_DESTINATIONS = [
  { match: 'centaurus', name: 'Centaurus Mall', lat: 33.7097, lon: 73.0491 },
  { match: 'convention', name: 'Jinnah Convention Centre', lat: 33.7134, lon: 73.1055 },
  { match: 'serena', name: 'Serena Hotel', lat: 33.7166, lon: 73.0631 },
  { match: 'f-6 markaz', name: 'F-6 Markaz', lat: 33.7241, lon: 73.0687 },
  { match: 'f6 markaz', name: 'F-6 Markaz', lat: 33.7241, lon: 73.0687 },
  { match: 'saudi pak', name: 'Saudi Pak Tower', lat: 33.7159, lon: 73.0553 },
  { match: 'ise tower', name: 'ISE Tower', lat: 33.7119, lon: 73.0578 },
  { match: 'stock exchange', name: 'ISE Tower', lat: 33.7119, lon: 73.0578 },
  { match: 'jinnah super', name: 'Jinnah Super Market', lat: 33.7182, lon: 73.0606 },
  { match: 'f-7 markaz', name: 'Jinnah Super Market', lat: 33.7182, lon: 73.0606 },
  { match: 'f7 markaz', name: 'Jinnah Super Market', lat: 33.7182, lon: 73.0606 },
  { match: 'aabpara', name: 'Aabpara Market', lat: 33.7068, lon: 73.0869 },
];

function matchCurated(query) {
  const q = query.trim().toLowerCase();
  return CURATED_DESTINATIONS.find((d) => q.includes(d.match)) ?? null;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Live "did you mean" suggestions for the destination input — matches
 * substrings first (cheap, exact), then falls back to fuzzy edit-distance
 * scoring so a typo like "sentaurus mal" still surfaces Centaurus Mall.
 * Only searches the curated table (see above) since those are the only
 * destinations we can guarantee resolve correctly.
 */
export function suggestDestinations(query, limit = 4) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const uniqueByName = new Map();
  for (const d of CURATED_DESTINATIONS) {
    if (!uniqueByName.has(d.name)) uniqueByName.set(d.name, d);
  }
  const candidates = [...uniqueByName.values()];

  const scored = candidates.map((d) => {
    const name = d.name.toLowerCase();
    if (name.includes(q) || q.includes(d.match)) {
      return { ...d, score: 1 };
    }
    const dist = levenshtein(q, name.slice(0, q.length + 3));
    const score = 1 - dist / Math.max(q.length, 4);
    return { ...d, score };
  });

  return scored
    .filter((d) => d.score > 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function geocodeDestination(query) {
  const curated = matchCurated(query);
  if (curated) return { name: curated.name, lat: curated.lat, lon: curated.lon };

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '3');
  url.searchParams.set('viewbox', BLUE_AREA_VIEWBOX);
  url.searchParams.set('bounded', '1'); // strictly bound — an unbound guess can land anywhere on Earth
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'en' },
  });
  if (!res.ok) throw new Error('Geocoding failed');
  const results = await res.json();
  if (!results.length) return null;

  const best = results[0];
  return {
    name: best.display_name.split(',')[0],
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
  };
}

export async function reverseGeocode(lat, lon) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'en' },
  });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const data = await res.json();
  return data.display_name?.split(',')[0] ?? 'Aap ka location';
}

export function defaultOrigin() {
  // Demo "you are here" point — a fixed spot on Jinnah Avenue, Blue Area
  return { lat: 33.7108, lon: 73.0551, name: 'Jinnah Avenue, Blue Area' };
}

export const BLUE_AREA = BLUE_AREA_CENTER;
