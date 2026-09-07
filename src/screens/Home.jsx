import { useEffect, useMemo, useState, useRef } from 'react';
import MicButton from '../components/MicButton';
import LanguageSelect from '../components/LanguageSelect';
import { startListening, isSttSupported } from '../services/stt';
import { suggestDestinations } from '../services/geocode';
import { getRecentTrips, getFavorites } from '../services/history';
import { t } from '../i18n/strings';
import './Home.css';

const DEMO_DESTINATIONS = [
  'Centaurus Mall',
  'Convention Center',
  'Serena Hotel',
  'F-6 Markaz',
  'Jinnah Super Market',
  'Saudi Pak Tower',
];

export default function Home({ preferences, activeDestination, onResume, onDestinationChosen, onLanguageChange }) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [recent, setRecent] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const sttSupported = isSttSupported();
  const sessionRef = useRef(null);
  const language = preferences?.language ?? 'roman';

  useEffect(() => {
    setRecent(getRecentTrips(4));
    setFavorites(getFavorites());
  }, [activeDestination]);

  const suggestions = useMemo(
    () => (searchText.trim().length >= 2 ? suggestDestinations(searchText, 4) : []),
    [searchText]
  );

  async function handleMicTap() {
    setError(null);

    if (!listening) {
      // start recording
      setTranscript('');
      try {
        sessionRef.current = await startListening({
          language,
          onError: (err) => setError(err.message?.includes('GROQ_API_KEY')
            ? t(language, 'errorVoiceSetup')
            : t(language, 'errorTranscribeFailed')),
        });
        setListening(true);
      } catch (err) {
        setError(err.message?.includes('GROQ_API_KEY')
          ? t(language, 'errorVoiceSetup')
          : t(language, 'errorMicPermission'));
      }
      return;
    }

    // stop recording -> upload -> transcribe
    setListening(false);
    setTranscribing(true);
    try {
      const text = await sessionRef.current.stop();
      setTranscript(text);
      if (!text) setError(t(language, 'errorNoSpeech'));
      sessionRef.current = null;
    } catch (err) {
      setError(err.message?.includes('GROQ_API_KEY')
        ? t(language, 'errorVoiceSetup')
        : t(language, 'errorTranscribeFailed'));
    } finally {
      setTranscribing(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchText.trim()) onDestinationChosen(searchText.trim());
  }

  return (
    <div className="home">
      <div className="home__lang-row">
        <LanguageSelect language={language} onChange={onLanguageChange} />
      </div>

      <div className="home__hero">
        <p className="home__eyebrow">{t(language, 'appName')}</p>
        <h1 className={`home__title ${language === 'ur' ? 'is-native' : ''}`}>
          {preferences?.name
            ? t(language, 'homeTitleNamed', { name: preferences.name })
            : t(language, 'homeTitle')}
        </h1>
        <p className="home__subtitle">{t(language, 'homeSubtitle')}</p>
      </div>

      {activeDestination && (
        <button className="home__resume" onClick={onResume}>
          🧭 {t(language, 'resumeBanner', { q: activeDestination })}
        </button>
      )}

      <div className="home__mic-wrap">
        <MicButton
          listening={listening}
          onClick={handleMicTap}
          disabled={!sttSupported || transcribing}
          label={t(language, listening ? 'micAriaListening' : 'micAriaIdle')}
        />
        <p className="home__mic-hint">
          {transcribing
            ? t(language, 'micHintTranscribing')
            : listening
            ? t(language, 'micHintListening')
            : sttSupported
            ? t(language, 'micHintIdle')
            : t(language, 'micHintUnsupported')}
        </p>
      </div>

      {transcript && (
        <div className="home__transcript">
          <p className="home__transcript-label">{t(language, 'transcriptLabel')}</p>
          <p className="home__transcript-text">"{transcript}"</p>
          <button className="home__go" onClick={() => onDestinationChosen(transcript)}>
            {t(language, 'goButton')}
          </button>
        </div>
      )}

      {error && <p className="home__error" role="alert">{error}</p>}

      <form className="home__search" onSubmit={handleSearchSubmit}>
        <input
          className="home__search-input"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t(language, 'searchPlaceholder')}
          aria-label={t(language, 'searchPlaceholder')}
        />
        {suggestions.length > 0 && (
          <ul className="home__suggestions" role="listbox" aria-label={t(language, 'suggestionsLabel')}>
            {suggestions.map((s) => (
              <li key={s.name}>
                <button type="button" onClick={() => onDestinationChosen(s.name)}>
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {favorites.length > 0 && (
        <div className="home__demo-chips">
          <p className="home__demo-label">{t(language, 'favoritesLabel')}</p>
          <div className="home__chip-row">
            {favorites.map((f) => (
              <button key={f.name} className="home__chip home__chip--favorite" onClick={() => onDestinationChosen(f.query || f.name)}>
                ★ {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="home__demo-chips">
          <p className="home__demo-label">{t(language, 'recentTripsLabel')}</p>
          <div className="home__chip-row">
            {recent.map((r) => (
              <button key={r.name + r.at} className="home__chip" onClick={() => onDestinationChosen(r.query || r.name)}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="home__demo-chips">
        <p className="home__demo-label">{t(language, 'demoLabel')}</p>
        <div className="home__chip-row">
          {DEMO_DESTINATIONS.map((d) => (
            <button key={d} className="home__chip" onClick={() => onDestinationChosen(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
