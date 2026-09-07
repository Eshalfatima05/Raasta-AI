// Feature-detected haptics: uses Capacitor's native Haptics plugin when running
// in the Android/iOS app shell, falls back to the Vibration API in a browser,
// and silently no-ops anywhere neither is available (desktop, unsupported
// browsers) — callers never need to check support themselves.

let capacitorHaptics = null;
let capacitorLoadAttempted = false;

async function getCapacitorHaptics() {
  if (capacitorLoadAttempted) return capacitorHaptics;
  capacitorLoadAttempted = true;
  try {
    // Only resolves inside a Capacitor native shell — a plain browser tab
    // will fail this import, which is expected and handled below.
    const mod = await import('@capacitor/haptics');
    capacitorHaptics = mod;
  } catch {
    capacitorHaptics = null;
  }
  return capacitorHaptics;
}

/** Short, sharp tap — used for each turn-by-turn instruction during live nav. */
export async function hapticStep() {
  const haptics = await getCapacitorHaptics();
  if (haptics) {
    haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium }).catch(() => {});
    return;
  }
  navigator.vibrate?.(40);
}

/** Longer, celebratory pattern — used once, on arrival at the destination. */
export async function hapticArrival() {
  const haptics = await getCapacitorHaptics();
  if (haptics) {
    haptics.Haptics.notification({ type: haptics.NotificationType.Success }).catch(() => {});
    return;
  }
  navigator.vibrate?.([40, 60, 40, 60, 80]);
}
