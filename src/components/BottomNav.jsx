import { t } from '../i18n/strings';
import './BottomNav.css';

export default function BottomNav({ active, language, onChange }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav__item ${active === 'nav' ? 'is-active' : ''}`}
        onClick={() => onChange('nav')}
      >
        <span className="bottom-nav__icon">🧭</span>
        <span>{t(language, 'navTabLabel')}</span>
      </button>
      <button
        className={`bottom-nav__item ${active === 'settings' ? 'is-active' : ''}`}
        onClick={() => onChange('settings')}
      >
        <span className="bottom-nav__icon">⚙️</span>
        <span>{t(language, 'settingsTabLabel')}</span>
      </button>
    </nav>
  );
}
