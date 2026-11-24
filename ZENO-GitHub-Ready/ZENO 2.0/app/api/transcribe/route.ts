import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audio } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

    if (!apiKey) {
      console.log("NO API KEY FOUND");
      return NextResponse.json({ text: "", error: "No API key on server" }, { status: 500 });
    }
    if (!audio) return NextResponse.json({ text: "", error: "No audio" }, { status: 400 });

    // 1.5-flash sobcheye stable, age etai try korbo
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Transcribe exactly what is spoken in this audio. Keep original language mix - Bangla + English mixed, Hinglish, keep as is. Do NOT translate. Only return transcription." },
            { inlineData: { mimeType: "audio/webm", data: audio } }
          ]
        }]
      }),
    });

    const data = await res.json();
    console.log("Gemini response:", JSON.stringify(data).slice(0, 500));

    if (data.error) {
      return NextResponse.json({ text: "", error: data.error.message }, { status: 500 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    console.log("Transcribe error:", e.message);
    return NextResponse.json({ text: "", error: e.message }, { status: 500 });
  }
}
