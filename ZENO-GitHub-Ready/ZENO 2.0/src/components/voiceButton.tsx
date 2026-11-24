import { useState, useRef } from "react";

export default function VoiceButton({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const finalTextRef = useRef("");
  const isListeningRef = useRef(false);

  const start = () => {
    // Jodi cholche, tahole STOP
    if (isListeningRef.current && recRef.current) {
      isListeningRef.current = false;
      try { recRef.current.stop(); } catch {}
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
    isListeningRef.current = true;

    // AUTO - Browser er default vasha, tui jeta bolbi oitai dhorar chesta korbe
    rec.lang = "";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setListening(true);
      console.log("Mic started");
    };

    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const text = e.results[i][0].transcript;
          console.log("Heard:", text);
          finalTextRef.current += text + " ";
        }
      }
    };

    rec.onerror = (e: any) => {
      console.log("Mic error:", e.error);
      if (e.error === "not-allowed") {
        alert("Please allow Mic permission in Chrome");
        isListeningRef.current = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      // Jodi tui nije Stop na kore thakis, tahole abar chalu hobe (thamleo off hobe na)
      if (isListeningRef.current) {
        try { rec.start(); } catch {}
        return;
      }
      setListening(false);
      const fullText = finalTextRef.current.trim();
      console.log("Final text:", fullText);
      if (fullText) {
        onVoiceSend(fullText);
      }
      finalTextRef.current = "";
    };

    try {
      rec.start();
    } catch (err) {
      console.log(err);
      isListeningRef.current = false;
      setListening(false);
    }
  };

  return (
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
  );
}
