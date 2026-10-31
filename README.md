# Telugu Captions

Upload a Telugu video → get Telugu + English captions (SRT / VTT), editable in the browser.

## Features
- **Browser-based audio processing**: Extracts 16 kHz mono audio and chunks intelligently at natural pauses right inside the browser.
- **Telugu Transcription**: High accuracy Telugu speech-to-text using Groq's Whisper large-v3.
- **English Translation**: Context-aware natural English subtitle translation with Llama 3.3 70B.
- **Interactive Subtitle Editor**: Live synchronized video preview with bilingual overlay, editable timestamps and text, and one-click export (.srt, .vtt, .txt).
- **Zero Config Hosting**: Runs directly on **GitHub Pages** (client-side Groq API key) or on **Vercel** (serverless functions with server-side environment variables).

---

## Live Demo
- **GitHub Pages**: [https://mouresh.github.io/telugu-captions/](https://mouresh.github.io/telugu-captions/)
  *(Grab a free API key at [console.groq.com/keys](https://console.groq.com/keys) and paste it into the Groq API Key field.)*

---

## Deploying to Vercel (Optional Server Backend)
If you prefer hiding your API key behind a serverless backend:
1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → Import `mouresh/telugu-captions`.
2. In **Settings** → **Environment Variables**, add:
   - `GROQ_API_KEY`: your Groq API key (from [console.groq.com/keys](https://console.groq.com/keys))
   - `ACCESS_CODE`: optional password to protect against public use.
3. Deploy!
