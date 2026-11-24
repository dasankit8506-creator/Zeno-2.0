import { useState, useRef } from "react";

export default function VoiceButton({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const chunksRef = useRef<any[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };

      recorder.start();
      setRecording(true);
    } catch {
      alert("Please allow Mic permission in Chrome");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setProcessing(true);
    }
  };

  const transcribe = async (blob: Blob) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
      
      // Audio ke Base64 banano
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Transcribe exactly what is spoken in this audio. Keep the original language mix as it is - if user speaks Bangla + English mixed, Hinglish, Hindi + English mixed, keep it mixed. Do NOT translate to English. Only return the transcription, nothing else." },
              { inlineData: { mimeType: "audio/webm", data: base64 } }
            ]
          }]
        }),
      });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      
      setProcessing(false);
      if (text) {
        onVoiceSend(text);
      } else {
        alert("Could not hear, please try again");
      }
    } catch (err) {
      console.log(err);
      setProcessing(false);
      alert("Voice failed, please try again");
    }
  };

  const handleClick = () => {
    if (processing) return;
    if (recording) stopRecording();
    else startRecording();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={recording ? "Tap to Stop" : "Tap to Speak - Any Language"}
      style={{ 
        padding: "8px 10px", 
        borderRadius: "12px", 
        border: "1px solid #ddd", 
        cursor: "pointer", 
        background: recording ? "#ff4d4d" : processing ? "#ffeaa7" : "white",
        color: recording ? "white" : "black",
        fontWeight: recording ? "bold" : "normal"
      }}
    >
      {recording ? "⏹️ Stop" : processing ? "⏳..." : "🎤"}
    </button>
  );
}
