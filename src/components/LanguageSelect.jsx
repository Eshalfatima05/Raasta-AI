import { LANGUAGES, LANGUAGE_LABEL } from '../i18n/strings';
import './LanguageSelect.css';

export default function LanguageSelect({ language, onChange }) {
  return (
    <select className="language-select" value={language} onChange={(e) => onChange(e.target.value)} aria-label="Language / زبان">
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_LABEL[lang]}
        </option>
      ))}
    </select>
  );
}
