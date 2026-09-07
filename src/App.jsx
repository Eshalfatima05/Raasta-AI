import { useState } from 'react';
import Home from './screens/Home';
import Guide from './screens/Guide';
import Onboarding from './screens/Onboarding';
import Settings from './screens/Settings';
import BottomNav from './components/BottomNav';
import { getPreferences, savePreferences } from './services/preferences';
import { useNavSession } from './hooks/useNavSession';
import './theme.css';

export default function App() {
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [tab, setTab] = useState('nav');
  const [screen, setScreen] = useState('picker'); // 'picker' | 'guide' — within the nav tab
  const session = useNavSession(preferences);

  if (!preferences) {
    return <Onboarding onComplete={() => setPreferences(getPreferences())} />;
  }

  const language = preferences.language ?? 'roman';

  function handleDestinationChosen(query) {
    session.start(query);
    setScreen('guide');
  }

  function handleEndSession() {
    session.end();
    setScreen('picker');
  }

  function handleLanguageChange(nextLanguage) {
    const updated = { ...preferences, language: nextLanguage };
    savePreferences(updated);
    setPreferences(updated);
  }

  return (
    <>
      <div className="app-content">
        {tab === 'settings' && <Settings preferences={preferences} onSaved={setPreferences} />}

        {tab === 'nav' && screen === 'picker' && (
          <Home
            preferences={preferences}
            activeDestination={session.destinationQuery}
            onResume={() => setScreen('guide')}
            onDestinationChosen={handleDestinationChosen}
            onLanguageChange={handleLanguageChange}
          />
        )}

        {tab === 'nav' && screen === 'guide' && session.destinationQuery && (
          <Guide
            session={session}
            language={language}
            onBack={() => setScreen('picker')}
            onEnd={handleEndSession}
          />
        )}
      </div>
      <BottomNav active={tab} language={language} onChange={setTab} />
    </>
  );
}
