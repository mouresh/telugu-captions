// POST /api/translate  JSON: { items:[{id,te}], context:[string], topic?:string }
// Returns natural English subtitle lines, one per input item.
const { checkAccess } = require('./_shared');

const SYSTEM = `You are a professional Telugu-to-English subtitle translator.
You receive numbered Telugu subtitle lines produced by speech recognition (they may contain small recognition errors).
Rules:
- Translate each line into natural, fluent, concise English suitable for subtitles.
- Fix obvious speech-recognition mistakes using the surrounding lines and the topic hint, but never invent content.
- Keep names, places, numbers, and technical terms accurate. Transliterate proper nouns normally (e.g. Hyderabad, Vijayawada).
- Keep the meaning and tone of the speaker (casual stays casual).
- Return exactly one English line per input id. If a line is only noise or filler, return an empty string.
- Output ONLY valid JSON: {"translations":[{"id":<number>,"text":"<English>"}]}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAccess(req, res)) return;

  try {
    const { items = [], context = [], topic = '' } =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!items.length) return res.status(200).json({ translations: [] });

    const user =
      (topic ? `Topic / context of the video: ${String(topic).slice(0, 300)}\n\n` : '') +
      (context.length ? `Previous English subtitles (for continuity only, do not repeat):\n${context.join('\n')}\n\n` : '') +
      `Translate these lines:\n${JSON.stringify(items)}`;

    const candidateModels = [
      process.env.TRANSLATE_MODEL,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'llama-3.3-70b-versatile',
    ].filter(Boolean);

    let lastError = null;
    let data = null;

    for (const model of candidateModels) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: user },
            ],
          }),
        });

        if (!r.ok) {
          const t = await r.text();
          let msg = t;
          try { msg = JSON.parse(t).error.message; } catch (_) {}
          lastError = msg;
          if (r.status === 404) continue;
          return res.status(r.status === 429 ? 429 : 502).json({ error: 'Translation failed: ' + msg });
        }

        data = await r.json();
        break;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!data) {
      return res.status(502).json({ error: 'Translation failed: ' + (lastError || 'No available models') });
    }
    let parsed = {};
    try { parsed = JSON.parse(data.choices[0].message.content); } catch (_) {}
    const map = new Map((parsed.translations || []).map((t) => [Number(t.id), String(t.text || '').trim()]));
    const translations = items.map((it) => ({ id: it.id, text: map.get(Number(it.id)) || '' }));
    res.status(200).json({ translations });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
