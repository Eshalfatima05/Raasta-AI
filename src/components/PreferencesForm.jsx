import { useEffect, useState } from 'react';
import { geocodeDestination, defaultOrigin, reverseGeocode } from '../services/geocode';
import { isGpsSupported, getCurrentPosition } from '../services/gps';
import { VOICES } from '../services/preferences';
import { t } from '../i18n/strings';
import './PreferencesForm.css';

// Shared by Onboarding (first launch) and Settings (revisit any time) — same
// three preferences, same validation. Onboarding auto-runs location detection
// on mount; Settings leaves it to the "use my location" button so opening
// Settings doesn't re-prompt for GPS permission every time. Display language
// is a separate preference switched from the Guide screen, not here — this
// form just renders in whatever language is currently active.
export default function PreferencesForm({ initial, language, buttonLabel, onSave, autoDetectLocation = false }) {
  const [name, setName] = useState(initial.name ?? '');
  const [voice, setVoice] = useState(initial.voice ?? VOICES.female);
  const [originQuery, setOriginQuery] = useState(initial.origin?.name ?? defaultOrigin().name);
  const [originCoords, setOriginCoords] = useState(null); // set when GPS-confirmed, cleared on manual edit
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function detectLocation() {
    if (!isGpsSupported()) return;
    setLocating(true);
    getCurrentPosition()
      .then(async (pos) => {
        const placeName = await reverseGeocode(pos.lat, pos.lon).catch(() => 'Aap ka current location');
        setOriginCoords(pos);
        setOriginQuery(placeName);
      })
      .catch(() => {
        // permission denied or unavailable — leave the field as-is
      })
      .finally(() => setLocating(false));
  }

  useEffect(() => {
    if (autoDetectLocation) detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    let origin = initial.origin ?? defaultOrigin();
    if (originCoords) {
      origin = { ...originCoords, name: originQuery.trim() || 'Aap ka current location' };
    } else if (originQuery.trim() && originQuery.trim() !== origin.name) {
      const found = await geocodeDestination(originQuery.trim());
      if (!found) {
        setError(t(language, 'formErrorOrigin', { q: originQuery }));
        setSaving(false);
        return;
      }
      origin = found;
    }

    onSave({ name: name.trim(), voice, origin });
    setSaving(false);
  }

  return (
    <form className="prefs-form" onSubmit={handleSubmit}>
      <label className="prefs-form__field">
        <span>{t(language, 'formName')}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(language, 'formNamePlaceholder')}
        />
      </label>

      <div className="prefs-form__field">
        <span>{t(language, 'formVoice')}</span>
        <div className="prefs-form__chip-row">
          <button
            type="button"
            className={`prefs-form__chip ${voice === VOICES.female ? 'is-selected' : ''}`}
            onClick={() => setVoice(VOICES.female)}
          >
            {t(language, 'formVoiceFemale')}
          </button>
          <button
            type="button"
            className={`prefs-form__chip ${voice === VOICES.male ? 'is-selected' : ''}`}
            onClick={() => setVoice(VOICES.male)}
          >
            {t(language, 'formVoiceMale')}
          </button>
        </div>
      </div>

      <label className="prefs-form__field">
        <span>{locating ? t(language, 'formOriginLocating') : t(language, 'formOriginLabel')}</span>
        <input
          type="text"
          value={originQuery}
          onChange={(e) => {
            setOriginQuery(e.target.value);
            setOriginCoords(null);
          }}
          placeholder={t(language, 'formOriginPlaceholder')}
        />
      </label>

      {isGpsSupported() && (
        <button type="button" className="prefs-form__gps" onClick={detectLocation} disabled={locating}>
          {t(language, 'formGpsButton')}
        </button>
      )}

      {error && <p className="prefs-form__error">{error}</p>}

      <button className="prefs-form__go" type="submit" disabled={saving}>
        {saving ? t(language, 'formSaving') : buttonLabel}
      </button>
    </form>
  );
}
