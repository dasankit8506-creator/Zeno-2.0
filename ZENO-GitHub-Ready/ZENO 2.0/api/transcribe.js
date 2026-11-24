export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ text: '' });
  try {
    const { audio } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ text: '', error: 'No API key' });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: "Transcribe exactly what is spoken in this audio. Keep original language mix - Bangla + English mixed, Hinglish, keep as is. Do NOT translate. Only return transcription." },
          { inlineData: { mimeType: "audio/webm", data: audio } }
        ]}]
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ text: '', error: data.error.message });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ text: '', error: e.message });
  }
}
