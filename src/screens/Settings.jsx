import { useState } from 'react';
import PreferencesForm from '../components/PreferencesForm';
import { savePreferences } from '../services/preferences';
import { t } from '../i18n/strings';
import './Settings.css';

export default function Settings({ preferences, onSaved }) {
  const [savedJustNow, setSavedJustNow] = useState(false);
  const language = preferences?.language ?? 'roman';

  return (
    <div className="settings">
      <p className="settings__eyebrow">{t(language, 'settingsEyebrow')}</p>
      <h1 className="settings__title">{t(language, 'settingsTitle')}</h1>

      <PreferencesForm
        initial={preferences}
        language={language}
        buttonLabel={t(language, 'settingsSubmit')}
        onSave={(prefs) => {
          // PreferencesForm doesn't manage `language` (that's set from Guide) —
          // carry the current value forward so saving here doesn't reset it.
          const updated = { ...preferences, ...prefs };
          savePreferences(updated);
          setSavedJustNow(true);
          onSaved(updated);
        }}
      />

      {savedJustNow && <p className="settings__saved">{t(language, 'settingsSaved')}</p>}
    </div>
  );
}
