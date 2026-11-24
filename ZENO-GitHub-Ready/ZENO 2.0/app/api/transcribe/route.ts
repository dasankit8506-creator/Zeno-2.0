import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audio } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

    if (!apiKey) return NextResponse.json({ text: "" });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Transcribe exactly what is spoken in this audio. Keep the original language mix as it is - if user speaks Bangla + English mixed, Hinglish, Hindi + English mixed, keep it mixed. Do NOT translate to English. Only return the transcription, nothing else." },
            { inlineData: { mimeType: "audio/webm", data: audio } }
          ]
        }]
      }),
    });

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ text: "" });
  }
}
