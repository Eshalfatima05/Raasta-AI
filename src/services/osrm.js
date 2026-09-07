// Uses the free OpenStreetMap foot-routing service. No API key required.
// Docs: http://project-osrm.org/docs/v5.24.0/api/

const FOOT_ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';

export async function getRoute(origin, destination) {
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = `${FOOT_ROUTER}/${coords}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Routing failed');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry, // GeoJSON LineString — for map rendering
    steps: leg.steps.map((step, i) => ({
      index: i,
      instructionType: step.maneuver.type,       // turn, depart, arrive, etc.
      modifier: step.maneuver.modifier,           // left, right, straight, etc.
      distanceMeters: step.distance,
      location: {
        lat: step.maneuver.location[1],
        lon: step.maneuver.location[0],
      },
      streetName: step.name || null,
    })),
  };
}
