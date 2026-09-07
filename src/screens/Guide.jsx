import { lazy, Suspense, useRef, useState } from 'react';
import { isGpsSupported } from '../services/gps';
import { startListening, isSttSupported } from '../services/stt';
import { toggleFavorite, isFavorite } from '../services/history';
import { t } from '../i18n/strings';
import LandmarkCard from '../components/LandmarkCard';
import RouteMap from '../components/RouteMap';
import './Guide.css';

const CameraAssist = lazy(() => import('../components/CameraAssist'));

export default function Guide({ session, language, onBack, onEnd }) {
  const [showDebug, setShowDebug] = useState(false);
  const [asking, setAsking] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const askSessionRef = useRef(null);

  const {
    status,
    error,
    route,
    destination,
    origin,
    playingIndex,
    navigating,
    isPreview,
    rerouting,
    currentStepIndex,
    livePosition,
    heading,
    gpsAccuracy,
    headingPermissionDenied,
    arrived,
    remainingDistanceMeters,
    remainingDurationSeconds,
    destinationQuery,
    dismissArrival,
    playStep,
    playAll,
    startLiveNav,
    startPreviewNav,
    stopLiveNav,
    handleVoiceCommand,
  } = session;

  async function toggleAsk() {
    if (asking) {
      setAsking(false);
      const text = await askSessionRef.current?.stop();
      askSessionRef.current = null;
      if (text) handleVoiceCommand(text);
      return;
    }
    try {
      askSessionRef.current = await startListening({ language });
      setAsking(true);
    } catch {
      setAsking(false);
    }
  }

  function handleToggleFavorite() {
    if (!destination) return;
    const nowFavorited = toggleFavorite({
      query: destinationQuery,
      name: destination.name,
      lat: destination.lat,
      lon: destination.lon,
    });
    setFavorited(nowFavorited);
  }

  return (
    <div className="guide">
      <div className="guide__topbar">
        <button className="guide__back" onClick={onBack}>
          {t(language, 'back')}
        </button>
        {status === 'ready' && (
          <button className="guide__end" onClick={onEnd}>
            {t(language, 'endTrip')}
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="guide__status">
          <div className="guide__spinner" />
          <p>{t(language, 'routeLoading')}</p>
        </div>
      )}

      {status === 'error' && error && (
        <div className="guide__status">
          <p className="guide__error" role="alert">{t(language, error.key, error.vars)}</p>
          <button className="guide__retry" onClick={onEnd}>
            {t(language, 'backToStart')}
          </button>
        </div>
      )}

      {status === 'ready' && route && (
        <>
          {arrived && (
            <div className="guide__arrival" role="alert">
              <div className="guide__arrival-card">
                <div className="guide__arrival-icon">🎉</div>
                <h2>{t(language, 'arrivedTitle')}</h2>
                <p>{t(language, 'arrivedSubtitle')}</p>
                <button className="guide__arrival-dismiss" onClick={dismissArrival}>
                  {t(language, 'arrivedDismiss')}
                </button>
              </div>
            </div>
          )}

          <div className="guide__header">
            <div className="guide__header-row">
              <div>
                <p className="guide__eyebrow">{t(language, 'destinationLabel')}</p>
                <h2 className="guide__destination">{destination.name}</h2>
              </div>
              <button
                className={`guide__favorite ${favorited || isFavorite(destination.name) ? 'is-active' : ''}`}
                onClick={handleToggleFavorite}
                aria-label={t(language, (favorited || isFavorite(destination.name)) ? 'favoriteRemove' : 'favoriteAdd')}
              >
                {(favorited || isFavorite(destination.name)) ? '★' : '☆'}
              </button>
            </div>
            <p className="guide__stats">
              {navigating && remainingDistanceMeters != null
                ? t(language, 'etaRemaining', {
                    km: (remainingDistanceMeters / 1000).toFixed(1),
                    min: Math.max(1, Math.round((remainingDurationSeconds ?? 0) / 60)),
                  })
                : `${(route.distanceMeters / 1000).toFixed(1)} km · ${Math.round(route.durationSeconds / 60)} min`}
            </p>
          </div>

          <RouteMap
            route={route}
            origin={origin}
            destination={destination}
            livePosition={livePosition}
            heading={heading}
            navigating={navigating}
            showDebug={showDebug}
          />

          <button
            className="guide__debug-toggle"
            onClick={() => setShowDebug((v) => !v)}
            aria-pressed={showDebug}
          >
            {showDebug ? t(language, 'hideDebugOverlay') : t(language, 'showDebugOverlay')}
          </button>

          {rerouting && (
            <div className="guide__rerouting" role="status">
              <div className="guide__spinner guide__spinner--small" />
              <span>{t(language, 'reroutingMessage')}</span>
            </div>
          )}

          {navigating && (
            <div className="guide__calibration" role="status">
              {isPreview && <span className="guide__preview-badge">{t(language, 'previewBadge')}</span>}
              <div className="guide__calibration-symbol">{heading == null ? '◌' : '▲'}</div>
              <div>
                <strong>{heading == null ? t(language, 'calibrationNeeded') : t(language, 'directionReady')}</strong>
                <p>{gpsAccuracy == null ? t(language, 'findingGps') : t(language, 'gpsAccuracy', { m: Math.round(gpsAccuracy) })}</p>
                {headingPermissionDenied && (
                  <p className="guide__calibration-warning">{t(language, 'headingPermissionDenied')}</p>
                )}
              </div>
            </div>
          )}

          {(route.safetyPoints?.length ?? 0) > 0 && (
            <p className="guide__safety-note">{t(language, 'mappedSafetyPoints', { n: route.safetyPoints.length })}</p>
          )}

          <Suspense fallback={null}>
            <CameraAssist language={language} />
          </Suspense>

          <div className="guide__actions">
            <button className="guide__play-all" onClick={playAll}>
              {t(language, 'playAll')}
            </button>
            {!navigating && isGpsSupported() && (
              <button className="guide__play-all" onClick={startLiveNav}>
                {t(language, 'liveNavStart')}
              </button>
            )}
            {!navigating && (
              <button className="guide__play-all guide__play-all--ghost" onClick={startPreviewNav}>
                {t(language, 'previewNavStart')}
              </button>
            )}
            {navigating && (
              <button className="guide__play-all" onClick={stopLiveNav}>
                {t(language, isPreview ? 'previewNavStop' : 'liveNavStop')}
              </button>
            )}
            {navigating && isSttSupported() && (
              <div className="guide__ask">
                <button className="guide__play-all guide__play-all--ghost" onClick={toggleAsk}>
                  {t(language, asking ? 'askQuestionListening' : 'askQuestionIdle')}
                </button>
                <p className="guide__ask-hint">{t(language, 'askQuestionHint')}</p>
              </div>
            )}
          </div>

          <ul className="guide__trail">
            {route.steps.map((step, i) => (
              <LandmarkCard
                key={step.index}
                step={step}
                index={i}
                isPlaying={playingIndex === step.index}
                isCurrent={navigating && i === currentStepIndex}
                language={language}
                onPlay={playStep}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
