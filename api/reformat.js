export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept either { prompt } (old) or { parts } (new vision format)
  const { prompt, parts } = req.body;
  if (!prompt && !parts) {
    return res.status(400).json({ error: 'No prompt or parts provided' });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Build contents — support both text-only and vision (images + text)
  const contents = [{
    parts: parts || [{ text: prompt }]
  }];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err?.error?.message || 'Gemini error' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
