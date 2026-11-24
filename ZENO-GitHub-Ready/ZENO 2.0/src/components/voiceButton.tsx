import { useState, useRef } from "react";

const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "bn-IN", label: "Bangla" },
  { code: "hi-IN", label: "Hindi" },
  { code: "en-US", label: "English (US)" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
];

export default function VoiceButton({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en-IN");
  const recRef = useRef<any>(null);
  const finalTextRef = useRef("");

  const start = () => {
    if (listening && recRef.current) {
      recRef.current.stop();
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice is not supported in this browser, please open in Chrome");
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    finalTextRef.current = "";

    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);

    rec.onresult = (e: any) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript;
        }
      }
      if (finalText) {
        finalTextRef.current += finalText + " ";
      }
    };

    rec.onend = () => {
      setListening(false);
      const fullText = finalTextRef.current.trim();
      if (fullText) {
        onVoiceSend(fullText);
      }
      finalTextRef.current = "";
    };

    rec.onerror = () => setListening(false);
    rec.start();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        disabled={listening}
        title="Voice Language"
        style={{ padding: "7px 4px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "12px", cursor: "pointer", background: "white", maxWidth: "85px" }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={start}
        title={listening ? "Tap to Stop" : "Tap to Speak"}
        style={{ 
          padding: "8px 10px", 
          borderRadius: "12px", 
          border: "1px solid #ddd", 
          cursor: "pointer", 
          background: listening ? "#ff4d4d" : "white",
          color: listening ? "white" : "black",
          fontWeight: listening ? "bold" : "normal"
        }}
      >
        {listening ? "⏹️ Stop" : "🎤"}
      </button>
    </div>
  );
}
