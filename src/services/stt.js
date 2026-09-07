// Speech-to-text. Primary: the browser's native Web Speech API (works
// offline from our backend, zero dependency on Groq being up). Falls back
// to Groq-hosted Whisper (via the backend) when Web Speech isn't available
// — chiefly Android WebView, which has no built-in recognizer. Same
// controller shape either way so callers don't care which path ran.

const API_BASE = import.meta.env.VITE_API_BASE || '';
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSttSupported() {
  return Boolean(SpeechRecognition) || Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

export async function startListening({ onError, language = 'roman' } = {}) {
  if (SpeechRecognition) return startWebSpeechListening({ onError, language });
  return startGroqListening({ onError });
}

function startWebSpeechListening({ onError, language }) {
  const recognition = new SpeechRecognition();
  recognition.lang = language === 'en' ? 'en-PK' : 'ur-PK';
  recognition.interimResults = true;
  recognition.continuous = false;
  let result = '';
  let settled = false;
  let finish;

  const stopped = new Promise((resolve) => {
    finish = (value = result) => {
      if (settled) return;
      settled = true;
      resolve(cleanVoiceQuery(value));
    };
  });

  recognition.onresult = (e) => {
    result = Array.from(e.results)
      .map((entry) => entry[0]?.transcript ?? '')
      .join(' ')
      .trim();
  };
  recognition.onerror = (e) => {
    if (e.error === 'no-speech') {
      finish('');
      return;
    }
    onError?.(new Error(e.error));
    finish('');
  };
  recognition.onend = () => finish();
  recognition.start();

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        finish();
      }
      return stopped;
    },
  };
}

async function startGroqListening({ onError }) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          try {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const text = await transcribe(blob);
            resolve(text);
          } catch (err) {
            if (onError) onError(err);
            reject(err);
          }
        };
        recorder.stop();
      }),
  };
}

async function transcribe(blob) {
  const form = new FormData();
  form.append('audio', blob, 'clip.webm');

  const res = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Transcription failed');
  }
  const data = await res.json();
  return cleanVoiceQuery(data.text?.trim() ?? '');
}

function cleanVoiceQuery(value) {
  return value
    .replace(/^(please\s+)?(take me to|go to|navigate to|find|show me|mujhe|mujhay)\s+/i, '')
    .replace(/\s+(jana hai|le kar jana hai|le chalo|par jana hai)\s*$/i, '')
    .trim();
}
