import { useCallback, useEffect, useRef, useState } from 'react';
import { geocodeDestination, defaultOrigin } from '../services/geocode';
import { buildGuidedRoute } from '../services/pipeline';
import { speak, stopSpeaking } from '../services/tts';
import { distanceMeters } from '../services/saliency';
import { watchHeading, watchPosition, requestHeadingPermission } from '../services/gps';
import { hapticStep, hapticArrival } from '../services/haptics';
import { recordTrip } from '../services/history';

const ARRIVAL_RADIUS_METERS = 30;
const OFF_PATH_THRESHOLD_METERS = 60;
const OFF_PATH_STRIKES_REQUIRED = 3; // consecutive off-path readings before rerouting — absorbs normal GPS jitter
const PREVIEW_TOTAL_DURATION_MS = 18000; // whole route "walked" in ~18s of simulated time
const PREVIEW_MIN_TICK_MS = 120;

function bearingDegrees(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Approximate distance from a point to the route polyline as the minimum
// distance to any of its vertices. Not a true point-to-segment distance, but
// close enough at the vertex density OSRM returns, and much cheaper than
// projecting onto every segment for a value that only gates a UX nicety.
function distanceToPolyline(point, polylinePoints) {
  let min = Infinity;
  for (const p of polylinePoints) {
    const d = distanceMeters(point, p);
    if (d < min) min = d;
  }
  return min;
}

export function useNavSession(preferences) {
  const [destinationQuery, setDestinationQuery] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(null);
  const [destination, setDestination] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [livePosition, setLivePosition] = useState(null);
  const [heading, setHeading] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [headingPermissionDenied, setHeadingPermissionDenied] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState(null);
  const [remainingDurationSeconds, setRemainingDurationSeconds] = useState(null);

  const stopWatchRef = useRef(null);
  const stopHeadingRef = useRef(null);
  const previewTimerRef = useRef(null);
  const currentStepIndexRef = useRef(0);
  const requestIdRef = useRef(0);
  const routeRef = useRef(null);
  const isPreviewRef = useRef(false);
  const offPathStrikesRef = useRef(0);
  const reroutingRef = useRef(false);
  const arrivedRef = useRef(false); // guards against double-firing arrival from two different code paths
  const origin = preferences?.origin ?? defaultOrigin();
  const voice = preferences?.voice;

  useEffect(() => { routeRef.current = route; }, [route]);

  const stopLiveNav = useCallback(() => {
    stopWatchRef.current?.();
    stopHeadingRef.current?.();
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    stopWatchRef.current = null;
    stopHeadingRef.current = null;
    previewTimerRef.current = null;
    offPathStrikesRef.current = 0;
    arrivedRef.current = false;
    setNavigating(false);
    setIsPreview(false);
    setRerouting(false);
    setLivePosition(null);
    setHeading(null);
    setGpsAccuracy(null);
    setRemainingDistanceMeters(null);
    setRemainingDurationSeconds(null);
  }, []);

  const start = useCallback(async (query) => {
    stopLiveNav();
    stopSpeaking();
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setPlayingIndex(null);
    setDestinationQuery(query);
    setStatus('loading');
    setRoute(null);
    setDestination(null);
    setError(null);
    setArrived(false);

    const requestId = ++requestIdRef.current;
    try {
      const dest = await geocodeDestination(query);
      if (!dest) throw new Error('not-found');
      if (requestIdRef.current !== requestId) return;
      setDestination(dest);
      const guided = await buildGuidedRoute(origin, dest);
      if (requestIdRef.current !== requestId) return;
      setRoute(guided);
      setStatus('ready');
      recordTrip({ query, name: dest.name, lat: dest.lat, lon: dest.lon });
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err.message === 'not-found'
        ? { key: 'routeNotFound', vars: { q: query } }
        : { key: 'routeBuildFailed' });
      setStatus('error');
    }
  // The origin coordinates are the intended session boundary; the preference object itself may be recreated by the form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lon, stopLiveNav]);

  const end = useCallback(() => {
    requestIdRef.current++;
    stopLiveNav();
    stopSpeaking();
    setDestinationQuery(null);
    setStatus('idle');
    setRoute(null);
    setDestination(null);
    setPlayingIndex(null);
    setError(null);
    setArrived(false);
  }, [stopLiveNav]);

  function playStep(step) {
    setPlayingIndex(step.index);
    speak(step.instruction.native, { voice, onEnd: () => setPlayingIndex(null) });
  }

  function playAll() {
    if (!route) return;
    let i = 0;
    const playNext = () => {
      if (i >= route.steps.length) {
        setPlayingIndex(null);
        return;
      }
      const step = route.steps[i];
      setPlayingIndex(step.index);
      speak(step.instruction.native, {
        voice,
        onEnd: () => {
          i += 1;
          playNext();
        },
      });
    };
    playNext();
  }

  function updateRemainingEstimate(pos) {
    const r = routeRef.current;
    const i = currentStepIndexRef.current;
    const currentStep = r.steps[i];
    if (!currentStep) return;
    const toCurrentTarget = distanceMeters(pos, currentStep.location);
    const restOfRoute = r.steps
      .slice(i + 1)
      .reduce((sum, s) => sum + s.distanceMeters, 0);
    const remainingMeters = toCurrentTarget + restOfRoute;
    const paceSecondsPerMeter = r.durationSeconds / Math.max(r.distanceMeters, 1);
    setRemainingDistanceMeters(remainingMeters);
    setRemainingDurationSeconds(Math.round(remainingMeters * paceSecondsPerMeter));
  }

  const rerouteFrom = useCallback(async (pos) => {
    const dest = destination;
    if (!dest || reroutingRef.current) return;
    reroutingRef.current = true;
    setRerouting(true);
    try {
      const guided = await buildGuidedRoute(pos, dest);
      setRoute(guided);
      currentStepIndexRef.current = 0;
      setCurrentStepIndex(0);
      offPathStrikesRef.current = 0;
      speak(guided.steps[0].instruction.native, { voice });
    } catch {
      // If rerouting fails (network blip), just keep following the old route —
      // failing loud here would be worse than staying on stale guidance.
    } finally {
      reroutingRef.current = false;
      setRerouting(false);
    }
  }, [destination, voice]);

  // Shared by real GPS updates and simulated preview ticks — this is the one
  // place that advances steps, detects arrival, and (for real GPS only)
  // detects drifting off the route.
  const evaluatePosition = useCallback((pos) => {
    const r = routeRef.current;
    if (!r) return;
    updateRemainingEstimate(pos);

    if (!isPreviewRef.current) {
      const offPath = distanceToPolyline(pos, r.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }))) > OFF_PATH_THRESHOLD_METERS;
      if (offPath) {
        offPathStrikesRef.current += 1;
        if (offPathStrikesRef.current >= OFF_PATH_STRIKES_REQUIRED) {
          rerouteFrom(pos);
          return;
        }
      } else {
        offPathStrikesRef.current = 0;
      }
    }

    const i = currentStepIndexRef.current;
    const step = r.steps[i];
    if (!step) return;
    if (distanceMeters(pos, step.location) <= ARRIVAL_RADIUS_METERS) {
      const next = i + 1;
      if (next >= r.steps.length) {
        arrivedRef.current = true;
        hapticArrival();
        setArrived(true);
        stopLiveNav();
        return;
      }
      hapticStep();
      currentStepIndexRef.current = next;
      setCurrentStepIndex(next);
      setPlayingIndex(r.steps[next].index);
      speak(r.steps[next].instruction.native, { voice, onEnd: () => setPlayingIndex(null) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, rerouteFrom, stopLiveNav]);

  function startLiveNav() {
    if (!route || navigating) return;
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setNavigating(true);
    setIsPreview(false);
    isPreviewRef.current = false;
    setArrived(false);
    speak(route.steps[0].instruction.native, { voice });

    // Must be requested synchronously-ish from this tap (the user gesture) —
    // iOS Safari silently ignores deviceorientation listeners registered
    // without this, with no error at all.
    requestHeadingPermission().then((granted) => {
      setHeadingPermissionDenied(!granted);
      if (granted) {
        stopHeadingRef.current = watchHeading({ onUpdate: setHeading });
      }
    });

    stopWatchRef.current = watchPosition({
      onUpdate: (pos) => {
        setLivePosition(pos);
        setGpsAccuracy(pos.accuracy ?? null);
        if (pos.heading != null) setHeading(pos.heading);
        evaluatePosition(pos);
      },
      onError: () => {
        setError({ key: 'gpsPermissionError' });
        stopLiveNav();
      },
    });
  }

  // Simulates walking the exact route at a fixed pace so live-nav — the
  // compass arrow, auto-advancing instructions, haptics, arrival celebration —
  // can be seen and reviewed without needing a phone physically in Blue Area.
  function startPreviewNav() {
    if (!route || navigating) return;
    const points = route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));
    if (points.length < 2) return;

    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setNavigating(true);
    setIsPreview(true);
    isPreviewRef.current = true;
    setArrived(false);
    setHeadingPermissionDenied(false);
    speak(route.steps[0].instruction.native, { voice });

    const tickMs = Math.max(PREVIEW_MIN_TICK_MS, PREVIEW_TOTAL_DURATION_MS / points.length);
    let pointIndex = 0;

    previewTimerRef.current = setInterval(() => {
      pointIndex += 1;
      if (pointIndex >= points.length) {
        clearInterval(previewTimerRef.current);
        previewTimerRef.current = null;
        // Safety net: force arrival if the last step's radius check never
        // fired (e.g. its maneuver point sits slightly off the final vertex).
        // Guarded by arrivedRef, not the 'navigating' state, since this
        // callback closes over the value from when the interval was created
        // and would otherwise always read stale.
        if (!arrivedRef.current) {
          arrivedRef.current = true;
          hapticArrival();
          setArrived(true);
          stopLiveNav();
        }
        return;
      }
      const pos = points[pointIndex];
      const prev = points[pointIndex - 1];
      setLivePosition(pos);
      setHeading(bearingDegrees(prev, pos));
      setGpsAccuracy(6); // synthetic "good fix" value, just for the UI's accuracy readout
      evaluatePosition(pos);
    }, tickMs);
  }

  function repeatCurrentInstruction() {
    const r = routeRef.current;
    const step = r?.steps[currentStepIndexRef.current];
    if (!step) return;
    setPlayingIndex(step.index);
    speak(step.instruction.native, { voice, onEnd: () => setPlayingIndex(null) });
  }

  function announceNextInstruction() {
    const r = routeRef.current;
    const next = r?.steps[currentStepIndexRef.current + 1];
    if (!next) return;
    speak(next.instruction.native, { voice });
  }

  function announceRemainingDistance() {
    if (remainingDistanceMeters == null) return;
    const km = (remainingDistanceMeters / 1000).toFixed(1);
    const mins = Math.max(1, Math.round((remainingDurationSeconds ?? 0) / 60));
    speak(`${km} کلومیٹر باقی ہے، تقریباً ${mins} منٹ میں پہنچ جائیں گے۔`, { voice });
  }

  // Simple mid-trip voice command matcher — Roman Urdu/English phrasing,
  // handled entirely on-device (no LLM round-trip needed for these three).
  function handleVoiceCommand(transcript) {
    const q = (transcript || '').toLowerCase();
    if (/kitna door|kitni door|how far|how much (further|farther)|distance/.test(q)) {
      announceRemainingDistance();
    } else if (/phir se|dobara|repeat|say again|once more/.test(q)) {
      repeatCurrentInstruction();
    } else if (/agla|next|what'?s next|aage kya/.test(q)) {
      announceNextInstruction();
    } else {
      speak('معاف کیجیے، سمجھ نہیں آیا۔', { voice });
    }
  }

  useEffect(() => () => {
    stopSpeaking();
    stopWatchRef.current?.();
    stopHeadingRef.current?.();
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
  }, []);

  return {
    destinationQuery, status, error, route, destination, origin,
    playingIndex, navigating, isPreview, rerouting, currentStepIndex,
    livePosition, heading, gpsAccuracy, headingPermissionDenied, arrived,
    remainingDistanceMeters, remainingDurationSeconds,
    dismissArrival: () => setArrived(false),
    start, end, playStep, playAll, startLiveNav, startPreviewNav, stopLiveNav,
    handleVoiceCommand,
  };
}
