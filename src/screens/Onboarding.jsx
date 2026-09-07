import { useEffect, useState } from 'react';
import { geocodeDestination, defaultOrigin, reverseGeocode } from '../services/geocode';
import { isGpsSupported, getCurrentPosition } from '../services/gps';
import { savePreferences, VOICES } from '../services/preferences';
import { t } from '../i18n/strings';
import '../components/PreferencesForm.css';
import './Onboarding.css';

const LANGUAGE = 'roman'; // no preference saved yet at onboarding time — switch after, from Home
const STEPS = ['name', 'voice', 'origin'];

export default function Onboarding({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [voice, setVoice] = useState(VOICES.female);
  const [originQuery, setOriginQuery] = useState(defaultOrigin().name);
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
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function goNext() {
    setError('');
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setError('');
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isLastStep) {
      goNext();
      return;
    }

    setError('');
    setSaving(true);

    let origin = defaultOrigin();
    if (originCoords) {
      origin = { ...originCoords, name: originQuery.trim() || 'Aap ka current location' };
    } else if (originQuery.trim() && originQuery.trim() !== defaultOrigin().name) {
      const found = await geocodeDestination(originQuery.trim());
      if (!found) {
        setError(t(LANGUAGE, 'formErrorOrigin', { q: originQuery }));
        setSaving(false);
        return;
      }
      origin = found;
    }

    savePreferences({ name: name.trim(), voice, origin });
    onComplete();
  }

  return (
    <div className="onboarding">
      <p className="onboarding__eyebrow">{t(LANGUAGE, 'onboardingEyebrow')}</p>

      <div className="onboarding__progress">
        {STEPS.map((s, i) => (
          <span key={s} className={`onboarding__dot ${i <= stepIndex ? 'is-done' : ''}`} />
        ))}
      </div>

      <form className="onboarding__form" onSubmit={handleSubmit}>
        {step === 'name' && (
          <>
            <h1 className="onboarding__title">{t(LANGUAGE, 'onboardingNameTitle')}</h1>
            <p className="onboarding__hint">{t(LANGUAGE, 'onboardingNameHint')}</p>
            <label className="prefs-form__field">
              <span>{t(LANGUAGE, 'formName')}</span>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(LANGUAGE, 'formNamePlaceholder')}
              />
            </label>
          </>
        )}

        {step === 'voice' && (
          <>
            <h1 className="onboarding__title">{t(LANGUAGE, 'onboardingVoiceTitle')}</h1>
            <p className="onboarding__hint">{t(LANGUAGE, 'onboardingVoiceHint')}</p>
            <div className="prefs-form__field">
              <span>{t(LANGUAGE, 'formVoice')}</span>
              <div className="prefs-form__chip-row">
                <button
                  type="button"
                  className={`prefs-form__chip ${voice === VOICES.female ? 'is-selected' : ''}`}
                  onClick={() => setVoice(VOICES.female)}
                >
                  {t(LANGUAGE, 'formVoiceFemale')}
                </button>
                <button
                  type="button"
                  className={`prefs-form__chip ${voice === VOICES.male ? 'is-selected' : ''}`}
                  onClick={() => setVoice(VOICES.male)}
                >
                  {t(LANGUAGE, 'formVoiceMale')}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'origin' && (
          <>
            <h1 className="onboarding__title">{t(LANGUAGE, 'onboardingOriginTitle')}</h1>
            <p className="onboarding__hint">{t(LANGUAGE, 'onboardingOriginHint')}</p>
            <label className="prefs-form__field">
              <span>{locating ? t(LANGUAGE, 'formOriginLocating') : t(LANGUAGE, 'formOriginLabel')}</span>
              <input
                type="text"
                value={originQuery}
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setOriginCoords(null);
                }}
                placeholder={t(LANGUAGE, 'formOriginPlaceholder')}
              />
            </label>
            {isGpsSupported() && (
              <button type="button" className="prefs-form__gps" onClick={detectLocation} disabled={locating}>
                {t(LANGUAGE, 'formGpsButton')}
              </button>
            )}
          </>
        )}

        {error && <p className="prefs-form__error">{error}</p>}

        <div className="onboarding__nav">
          {stepIndex > 0 && (
            <button type="button" className="onboarding__back" onClick={goBack}>
              {t(LANGUAGE, 'back')}
            </button>
          )}
          <button className="prefs-form__go onboarding__next" type="submit" disabled={saving}>
            {saving ? t(LANGUAGE, 'formSaving') : isLastStep ? t(LANGUAGE, 'onboardingSubmit') : t(LANGUAGE, 'onboardingNext')}
          </button>
        </div>
      </form>
    </div>
  );
}
