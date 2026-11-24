import { useState } from "react";

export default function VoiceButton({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  const [listening, setListening] = useState(false);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice is not supported in this browser, please open in Chrome");
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onstart = () => setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onVoiceSend(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <button
      type="button"
      onClick={start}
      title="Speak"
      style={{ padding: "8px 10px", borderRadius: "12px", border: "1px solid #ddd", cursor: "pointer", background: listening ? "#ffe0e0" : "white" }}
    >
      {listening ? "🎤 Listening..." : "🎤"}
    </button>
  );
}
