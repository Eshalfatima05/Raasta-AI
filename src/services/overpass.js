// Queries OpenStreetMap (via Overpass) for landmark categories that Pakistanis
// actually navigate by — mosques, petrol pumps, hospitals, markets, etc.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const LANDMARK_TAGS = [
  ['amenity', 'place_of_worship'], // mosques
  ['amenity', 'fuel'],             // petrol pumps
  ['amenity', 'hospital'],
  ['amenity', 'school'],
  ['amenity', 'bank'],
  ['amenity', 'marketplace'],
  ['shop', 'mall'],
  ['bridge', 'yes'],
  ['leisure', 'park'],
];

function buildBboxQuery(south, west, north, east) {
  const bbox = `${south},${west},${north},${east}`;
  const clauses = LANDMARK_TAGS
    .map(([k, v]) => `node(${bbox})["${k}"="${v}"];`)
    .join('\n');
  return `[out:json][timeout:25];(${clauses});out body;`;
}

function buildSafetyQuery(south, west, north, east) {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:25];(
    node(${bbox})["highway"="crossing"];
    node(${bbox})["highway"="traffic_signals"];
    node(${bbox})["barrier"];
    way(${bbox})["barrier"];
  );out center tags;`;
}

// One Overpass call for the whole route's bounding box (padded), instead of one
// call per turn — per-turn queries get queued/rate-limited by the public Overpass
// instance and can take minutes on a route with many maneuvers.
export async function getLandmarksForRoute(routeCoordinates, padDegrees = 0.003) {
  const lats = routeCoordinates.map((c) => c[1]);
  const lons = routeCoordinates.map((c) => c[0]);
  const south = Math.min(...lats) - padDegrees;
  const north = Math.max(...lats) + padDegrees;
  const west = Math.min(...lons) - padDegrees;
  const east = Math.max(...lons) + padDegrees;

  const query = buildBboxQuery(south, west, north, east);
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
  });
  if (!res.ok) throw new Error('Landmark lookup failed');
  const data = await res.json();

  return data.elements
    .filter((el) => el.tags?.name) // unnamed features aren't useful as spoken landmarks
    .map((el) => ({
      id: el.id,
      name: el.tags.name,
      category: categorize(el.tags),
      lat: el.lat,
      lon: el.lon,
      tags: el.tags,
    }));
}

export async function getSafetyPointsForRoute(routeCoordinates, padDegrees = 0.003) {
  const lats = routeCoordinates.map((c) => c[1]);
  const lons = routeCoordinates.map((c) => c[0]);
  const south = Math.min(...lats) - padDegrees;
  const north = Math.max(...lats) + padDegrees;
  const west = Math.min(...lons) - padDegrees;
  const east = Math.max(...lons) + padDegrees;
  const res = await fetch(OVERPASS_URL, { method: 'POST', body: buildSafetyQuery(south, west, north, east) });
  if (!res.ok) throw new Error('Safety lookup failed');
  const data = await res.json();

  return data.elements.flatMap((el) => {
    const point = el.lat != null ? el : el.center;
    if (!point) return [];
    const tags = el.tags ?? {};
    return [{
      id: `safety-${el.type}-${el.id}`,
      kind: tags.highway === 'crossing'
        ? 'crossing'
        : tags.highway === 'traffic_signals'
          ? 'traffic_signals'
          : 'barrier',
      lat: point.lat,
      lon: point.lon,
    }];
  });
}

function categorize(tags) {
  if (tags.amenity === 'place_of_worship') return 'mosque';
  if (tags.amenity === 'fuel') return 'petrol_pump';
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'bank') return 'bank';
  if (tags.amenity === 'marketplace' || tags.shop === 'mall') return 'market';
  if (tags.leisure === 'park') return 'park';
  return 'landmark';
}
