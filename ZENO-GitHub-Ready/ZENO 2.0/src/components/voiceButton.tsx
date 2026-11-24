import { useState } from "react";

export default function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const [listening, setListening] = useState(false);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Ei browser e voice cholbe na, Chrome e khol");
      return;
    }
    const rec = new SR();
    rec.lang = "bn-IN";
    rec.onstart = () => setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onText(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.start();
  };

  return (
    <button
      onClick={start}
      style={{ padding: "10px 16px", borderRadius: "20px", cursor: "pointer" }}
    >
      {listening ? "🎤 Shunchi..." : "🎤 Bolo"}
    </button>
  );
}
