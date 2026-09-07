import './MicButton.css';

export default function MicButton({ listening, onClick, disabled, label }) {
  return (
    <button
      className={`mic-button ${listening ? 'is-listening' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={label}
    >
      <span className="mic-button__ring mic-button__ring--1" />
      <span className="mic-button__ring mic-button__ring--2" />
      <span className="mic-button__core">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
          <path
            d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M19 11a7 7 0 0 1-14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}
