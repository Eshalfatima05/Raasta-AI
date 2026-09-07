import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — generous for a short voice clip, protects against a runaway recording
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE = 'https://api.groq.com/openai/v1';

// Edge TTS Urdu (Pakistan) neural voices — female/male
const URDU_VOICE = process.env.EDGE_TTS_VOICE || 'ur-PK-UzmaNeural';

// ---------------------------------------------------------------------------
// TTS — Microsoft Edge Read Aloud voices, free, no API key needed
// ---------------------------------------------------------------------------
app.post('/api/tts', async (req, res) => {
  const { text, voice } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice || URDU_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    audioStream.on('data', (chunk) => res.write(chunk));
    audioStream.on('close', () => res.end());
    audioStream.on('error', (err) => {
      console.error('TTS stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'TTS failed' });
    });
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// ---------------------------------------------------------------------------
// STT — Groq-hosted Whisper (much faster than OpenAI's own endpoint)
// ---------------------------------------------------------------------------
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set on server' });
  }
  if (!req.file) return res.status(400).json({ error: 'audio file is required' });

  try {
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer]), 'audio.webm');
    form.append('model', 'whisper-large-v3');
    form.append('language', 'ur');

    const groqRes = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq STT failed: ${errText}`);
    }

    const data = await groqRes.json();
    res.json({ text: data.text });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// ---------------------------------------------------------------------------
// LLM — Groq-hosted Llama, generates natural Urdu instructions from a single
// step + its top-ranked landmark (saliency ranking already happened client-side,
// so this prompt is small and fast — one landmark, not a list).
// ---------------------------------------------------------------------------
app.post('/api/generate-instruction', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set on server' });
  }
  const { step, landmark } = req.body;

  const systemPrompt = `You write short, natural spoken navigation instructions for Pakistani drivers, the way you'd tell a friend directions using a landmark. Always respond with ONLY a JSON object: {"urdu": "...", "native": "...", "english": "..."}. "urdu" is Roman Urdu (the way Pakistanis actually text/speak, NOT formal textbook Urdu) — this is shown on screen. "native" is the SAME instruction written in actual Urdu script (Nastaliq/Arabic script) — this is what gets spoken by a neural TTS voice, so it must be real Urdu script, not transliteration. Keep each line under 12 words. No extra text.`;

  const userPrompt = landmark
    ? `Turn type: ${step.instructionType}, direction: ${step.modifier}. Nearby landmark: "${landmark.name}" (${landmark.category}), ${landmark.distanceToTurn}m from the turn.`
    : `Turn type: ${step.instructionType}, direction: ${step.modifier}. No landmark available, distance: ${Math.round(step.distanceMeters)}m.`;

  try {
    const groqRes = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq LLM failed: ${errText}`);
    }

    const data = await groqRes.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    res.json(parsed);
  } catch (err) {
    console.error('Instruction generation error:', err);
    res.status(500).json({ error: 'Instruction generation failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, groqConfigured: Boolean(GROQ_API_KEY) });
});

// Catches multer errors (e.g. file too large) so they return clean JSON
// instead of an unhandled exception taking down the request.
app.use((err, req, res, next) => {
  if (err) {
    console.error('Request error:', err);
    return res.status(400).json({ error: err.message || 'Request failed' });
  }
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Rasta backend running on http://localhost:${PORT}`);
  console.log(`Groq API key configured: ${Boolean(GROQ_API_KEY)}`);
});
