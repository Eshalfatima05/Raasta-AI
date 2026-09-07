import { t } from '../i18n/strings';
import './LandmarkCard.css';

const CATEGORY_ICON = {
  mosque: '🕌',
  petrol_pump: '⛽',
  hospital: '🏥',
  market: '🛍️',
  bank: '🏦',
  school: '🏫',
  park: '🌳',
  landmark: '📍',
};

const INSTRUCTION_FIELD = { en: 'english', ur: 'native', roman: 'urdu' };

export default function LandmarkCard({ step, index, isPlaying, isCurrent, language, onPlay }) {
  const icon = step.landmark ? CATEGORY_ICON[step.landmark.category] ?? '📍' : '🧭';
  const primaryText = step.instruction[INSTRUCTION_FIELD[language] ?? 'urdu'];
  const isNativeScript = language === 'ur';

  return (
    <li className={`landmark-card ${isCurrent ? 'is-current' : ''}`}>
      <div className="landmark-card__marker">
        <span className="landmark-card__icon">{icon}</span>
      </div>
      <div className="landmark-card__body">
        <div className="landmark-card__eyebrow">{t(language, 'stepLabel', { n: index + 1 })}</div>
        <p className={`landmark-card__urdu ${isNativeScript ? 'is-native' : ''}`}>{primaryText}</p>
        {step.landmark && (
          <div className="landmark-card__meta">
            <span>{step.landmark.name}</span>
            <span className="landmark-card__dot">•</span>
            <span>{t(language, 'awayLabel', { m: step.landmark.distanceToTurn })}</span>
            <span className="landmark-card__dot">•</span>
            <span title="Landmark Saliency Score">
              {t(language, 'saliencyLabel', { n: step.landmark.saliency.total })}
            </span>
          </div>
        )}
      </div>
      <button
        className={`landmark-card__play ${isPlaying ? 'is-playing' : ''}`}
        onClick={() => onPlay(step)}
        aria-label={`Play instruction ${index + 1}`}
      >
        {isPlaying ? '❙❙' : '▶'}
      </button>
    </li>
  );
}
