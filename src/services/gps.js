// Thin wrapper around navigator.geolocation.watchPosition — the live GPS
// feed for turn-by-turn nav. Nothing else in the app should call the
// browser API directly, so this is the one place a Phase 2 swap (e.g. a
// mock position source for testing) would land.

export function isGpsSupported() {
  return Boolean(navigator.geolocation);
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toPosition(pos)),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function watchPosition({ onUpdate, onError }) {
  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate(toPosition(pos)),
    (err) => onError?.(err),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

export function isHeadingPermissionRequired() {
  return typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function';
}

// iOS 13+ Safari requires this to be called from a user gesture (e.g. a
// button tap) before 'deviceorientation' events will ever fire. Without it,
// the compass heading just silently never updates — no error, no event.
export async function requestHeadingPermission() {
  if (!isHeadingPermissionRequired()) return true; // not iOS — nothing to request
  try {
    const result = await DeviceOrientationEvent.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export function watchHeading({ onUpdate }) {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return () => {};

  const handleOrientation = (event) => {
    const heading = event.webkitCompassHeading ?? (event.alpha == null ? null : 360 - event.alpha);
    if (heading != null && Number.isFinite(heading)) onUpdate(heading);
  };

  window.addEventListener('deviceorientation', handleOrientation, true);
  return () => window.removeEventListener('deviceorientation', handleOrientation, true);
}

function toPosition(pos) {
  const { coords } = pos;
  return {
    lat: coords.latitude,
    lon: coords.longitude,
    accuracy: coords.accuracy,
    heading: Number.isFinite(coords.heading) ? coords.heading : null,
  };
}
