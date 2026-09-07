# Rasta (راستہ)

Voice-first, landmark-based navigation for Blue Area, Islamabad. Speak a
destination, get spoken directions built around real landmarks — "PSO pump
ke baad left lein" instead of "turn left in 250 meters."

Built for the millions of Pakistanis who navigate by landmarks, not street
names or GPS distances — low-literacy users, elderly citizens, delivery
riders, and anyone who's ever been told "seedha jao, phir masjid ke paas
mudo."

## Features

- **Voice destination input** — speak in Urdu/Roman Urdu, no typing required
  (Web Speech API on Chrome, Groq Whisper fallback for Android WebView)
- **Text search with fuzzy autocomplete** — typo-tolerant "did you mean"
  suggestions for typed destinations, for when voice isn't convenient
- **Landmark-based instructions** — "PSO pump ke baad left" instead of
  "turn left in 250m," generated via Groq Llama with a rule-based fallback
- **The Landmark Saliency Score** — the project's core technical
  contribution (see below)
- **A debug overlay** showing every candidate landmark considered at each
  turn, greyed out with its full score breakdown, next to the one that won
  — makes the ranking algorithm inspectable, not just a black box
- **Live turn-by-turn GPS navigation** with a compass-driven direction
  arrow, auto-advancing instructions, a live ETA countdown, automatic
  off-route detection with rerouting, and haptic feedback on each turn
- **Preview navigation mode** — simulates walking the route at a fixed pace
  so the entire live-nav experience (compass, ETA, haptics, arrival
  celebration) can be seen and reviewed without needing a phone physically
  in Blue Area
- **Mid-trip voice commands** — ask "kitna door hai?" (how far) or "phir se
  bolo" (repeat that) hands-free while navigating, no screen needed
- **Camera vision assist** — real-time object detection (TensorFlow.js +
  COCO-SSD) using the phone's rear camera, spoken alerts when a person or
  vehicle is ahead/left/right
- **Mapped safety points** — pedestrian crossings, traffic signals, and
  barriers along the route, pulled from OpenStreetMap
- **Trip history & favorites** — recent and starred destinations for
  one-tap reuse
- **3-language interface** — English, Urdu script, and Roman Urdu, switchable
  at any time
- **Onboarding + preferences** — name, voice (male/female Urdu neural
  voice), and home location, editable later from Settings
- **Resilient by design** — every external dependency (Groq, Overpass,
  Nominatim) has a fallback path so a flaky connection degrades the
  experience instead of breaking it
- Packaged for Android via Capacitor, with a custom app icon

## Stack

- **Frontend**: React (Vite), wrapped for mobile via Capacitor
- **Routing**: OSRM public demo server (free, no key)
- **Landmarks & safety points**: OpenStreetMap via Overpass API (free, no key)
- **Saliency ranking**: custom scoring — `src/services/saliency.js`
- **STT**: Web Speech API primary, Groq-hosted Whisper (`whisper-large-v3`)
  fallback — needs a free Groq key
- **Instruction generation**: Groq-hosted Llama 3.3, rule-based fallback —
  same key
- **TTS**: Microsoft Edge Read Aloud voices (via backend) — free, no key,
  genuinely good Urdu neural voices, male/female selectable
- **Vision**: TensorFlow.js + COCO-SSD, runs entirely on-device (no backend
  call, no key) — lazy-loaded so it doesn't bloat the initial page load
- **Haptics**: Capacitor Haptics on native, Vibration API fallback on web

## Setup

### 1. Get a Groq API key
Free at [console.groq.com](https://console.groq.com). Used for speech-to-text
fallback and instruction generation — not for TTS or vision, which need no
key at all.

### 2. Configure the backend
```bash
cd server
npm install
cp .env.example .env
# paste your key into .env: GROQ_API_KEY=...
```

### 3. Run everything
From the project root:
```bash
npm install
npm run dev:all
```
This starts the frontend (http://localhost:5173) and backend
(http://localhost:3001) together. The Vite dev server proxies `/api/*`
calls to the backend automatically — no CORS setup needed.

Open on your phone's browser (same wifi network) or desktop Chrome. Mic
and camera access need HTTPS or localhost — if testing on a phone over
LAN, use `ngrok` or Vite's `--host` with a trusted cert, or just test on
desktop first.

**Can't test live GPS at a desk?** Use the **Preview navigation** button on
the route screen — it simulates walking the exact route so you can see
turn-by-turn guidance, the compass arrow, ETA, haptics, and the arrival
celebration without moving.

## Run as a mobile app (Capacitor)

Android platform is already added (`android/` folder) with a custom Rasta
app icon. Because the app depends on a backend, set `VITE_API_BASE` to
wherever you deploy the backend (a `render.yaml` is included for a
one-click Render deploy) before building:

```bash
# in .env at project root:
VITE_API_BASE=https://your-backend-url.com

npm run build
npx cap sync android
npx cap open android
```

For iOS: `npx cap add ios` on a Mac with Xcode, then `npx cap open ios`.
Note: iOS Safari requires a compass-permission prompt on first live-nav
use (handled in `src/services/gps.js`) — this is normal, not a bug.

## Architecture

```
Voice input (record) ──► Groq Whisper (STT, via backend)
        or text search w/ fuzzy autocomplete
                                │
Nominatim geocoding ──► OSRM route ──► Overpass landmark + safety search
                                                    │
                                          Landmark Saliency Score
                                          (ranks ALL candidates, keeps
                                           the rejected ones for debug view)
                                                    │
                                    Groq Llama instruction generation (via backend)
                                       (falls back to rule-based if it fails)
                                                    │
                                    Edge TTS playback (via backend)
                                                    │
                        Live GPS (or simulated preview) advances steps,
                        tracks ETA, detects off-route drift & reroutes,
                        triggers haptics + arrival celebration
                                                    │
                    Camera vision assist (on-device TensorFlow.js) runs
                    independently, watching for people/vehicles ahead
```

Core files:
- `src/services/pipeline.js` — orchestrates the whole flow, keeps ranked
  (not just winning) landmark candidates per step
- `src/services/saliency.js` — **the project's technical contribution**:
  ranks candidate landmarks by category weight + distance to turn + OSM
  prominence, so the LLM only ever sees the single best landmark instead
  of every nearby POI (keeps prompts small, fast, and cheap)
- `src/services/instructions.js` — calls Groq via the backend, with a
  rule-based fallback if the request fails
- `src/services/geocode.js` — curated + fuzzy-matched destinations, with
  coordinates verified against independent sources
- `src/services/history.js` — localStorage-backed recent trips & favorites
- `src/hooks/useNavSession.js` — the live/preview nav state machine:
  position tracking (real or simulated), arrival detection, off-route
  rerouting, ETA calculation, haptics, celebration, mid-trip voice commands
- `src/services/gps.js` — geolocation + compass heading, including the
  iOS permission handshake
- `src/components/RouteMap.jsx` — map rendering, including the debug
  overlay for rejected landmark candidates
- `src/components/CameraAssist.jsx` — on-device object detection for
  obstacle awareness
- `src/components/ErrorBoundary.jsx` — catches any uncaught error app-wide
  so a bug shows a recoverable screen instead of a blank white page
- `server/index.js` — the whole backend: three endpoints
  (`/api/tts`, `/api/transcribe`, `/api/generate-instruction`)

## Known limitations (be upfront about these to judges)

- Saliency scoring uses distance, category, and OSM metadata richness as a
  proxy for real-world visibility/recognizability — not actual visual
  salience.
- CameraAssist detects general obstacle categories (people/vehicles) for
  situational awareness; it does not yet confirm "is this the landmark the
  instructions mentioned" — that's a distinct, harder CV problem (visual
  landmark matching) left as future work.
- OSM landmark data quality varies by area — this is why the MVP is scoped
  to Blue Area, Islamabad and nearby well-mapped spots rather than
  citywide, with a curated destination table (`src/services/geocode.js`)
  covering the most likely demo/test queries with verified coordinates.
- The app depends on a live backend for STT fallback/TTS/instructions —
  deploy it (see `render.yaml`) before relying on those features.
- Off-route rerouting is distance-to-polyline based (nearest vertex, not a
  true point-to-segment projection) — accurate enough to trigger correctly
  at the ~60m threshold used, but not geometrically exact.

## Future work

- Learn saliency weights from user feedback instead of hand-tuned values
- Camera-based landmark verification ("am I at the right pump?") — distinct
  from the obstacle-awareness CameraAssist already built
- Offline routing and tiles
- Additional regional languages (Punjabi, Saraiki, Pashto, Sindhi) —
  templates are already data-driven; the bottleneck is available TTS voices
