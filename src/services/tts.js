// Text-to-speech via the backend, which uses Microsoft Edge's Read Aloud voices
// (free, no API key, high quality Urdu neural voices — see server/index.js).
// Backend call is necessary because Edge TTS requires a server-side websocket
// connection; it can't be called directly from the browser.

const API_BASE = import.meta.env.VITE_API_BASE || '';

let currentAudio = null;

export function isTtsSupported() {
  return true; // handled server-side, always "supported" from the client's view
}

export async function speak(text, { onEnd, onError, voice } = {}) {
  stopSpeaking();

  try {
    const res = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) throw new Error('TTS request failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    currentAudio = new Audio(url);
    currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };
    currentAudio.onerror = () => {
      URL.revokeObjectURL(url);
      if (onError) onError(new Error('Playback failed'));
    };
    await currentAudio.play();
  } catch (err) {
    console.error('TTS error:', err);
    if (onError) onError(err);
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
