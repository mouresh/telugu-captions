// POST /api/transcribe?prompt=...   body: raw 16 kHz mono WAV (<= ~3 MB)
// Returns Telugu segments with timestamps (Whisper large-v3 on Groq).
const { checkAccess, readBody } = require('./_shared');

const BASE_PROMPT = 'ఇది తెలుగు భాషలో మాట్లాడిన వీడియో. సరైన విరామ చిహ్నాలతో తెలుగు లిపిలో రాయండి.';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAccess(req, res)) return;

  try {
    const audio = await readBody(req);
    if (!audio || audio.length < 1000) return res.status(400).json({ error: 'Empty audio chunk.' });

    const prev = (req.query && req.query.prompt ? String(req.query.prompt) : '').slice(-180);
    const prompt = (BASE_PROMPT + ' ' + prev).trim();

    const fd = new FormData();
    fd.append('file', new Blob([audio], { type: 'audio/wav' }), 'chunk.wav');
    fd.append('model', process.env.WHISPER_MODEL || 'whisper-large-v3');
    fd.append('language', 'te');
    fd.append('response_format', 'verbose_json');
    fd.append('temperature', '0');
    fd.append('prompt', prompt);
    fd.append('timestamp_granularities[]', 'segment');

    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: fd,
    });

    if (!r.ok) {
      const t = await r.text();
      let msg = t;
      try { msg = JSON.parse(t).error.message; } catch (_) {}
      return res.status(r.status === 429 ? 429 : 502).json({ error: 'Transcription failed: ' + msg });
    }

    const data = await r.json();
    const segments = (data.segments || []).map((s) => ({
      start: s.start,
      end: s.end,
      text: (s.text || '').trim(),
      no_speech_prob: s.no_speech_prob,
      avg_logprob: s.avg_logprob,
      compression_ratio: s.compression_ratio,
    }));
    res.status(200).json({ segments });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
