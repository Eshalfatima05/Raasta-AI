// User preferences captured once at onboarding, persisted locally.
// No accounts/backend involved — this is a single-device demo app.

import { defaultOrigin } from './geocode';

const STORAGE_KEY = 'rasta:preferences';

export const VOICES = {
  female: 'ur-PK-UzmaNeural',
  male: 'ur-PK-AsadNeural',
};

const DEFAULTS = {
  name: '',
  voice: VOICES.female,
  language: 'roman', // 'en' | 'ur' | 'roman' — switched from the Guide screen
  origin: defaultOrigin(),
};

export function getPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, ...prefs }));
}
