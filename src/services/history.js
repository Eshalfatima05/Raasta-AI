// Records successful trips locally so the Home screen can offer "recent" and
// "favorite" destinations for one-tap reuse — no backend needed, this is
// purely a per-device convenience layer.

const HISTORY_KEY = 'rasta:trip-history';
const FAVORITES_KEY = 'rasta:favorites';
const MAX_HISTORY = 12;

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage can fail (quota, private browsing) — history is a convenience,
    // not core functionality, so we just silently drop the write.
  }
}

/** Call after a route is successfully built, so it can be offered again later. */
export function recordTrip({ query, name, lat, lon }) {
  if (!name) return;
  const history = readList(HISTORY_KEY).filter((t) => t.name !== name);
  history.unshift({ query, name, lat, lon, at: Date.now() });
  writeList(HISTORY_KEY, history.slice(0, MAX_HISTORY));
}

export function getRecentTrips(limit = 4) {
  return readList(HISTORY_KEY).slice(0, limit);
}

export function getFavorites() {
  return readList(FAVORITES_KEY);
}

export function isFavorite(name) {
  return getFavorites().some((t) => t.name === name);
}

export function toggleFavorite({ query, name, lat, lon }) {
  const favorites = getFavorites();
  const exists = favorites.some((t) => t.name === name);
  const next = exists
    ? favorites.filter((t) => t.name !== name)
    : [{ query, name, lat, lon, at: Date.now() }, ...favorites];
  writeList(FAVORITES_KEY, next);
  return !exists; // returns the new favorited state
}
