import { useState, useRef } from "react";

export default function VoiceButton({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const recsRef = useRef<any[]>([]);
  const finalTextRef = useRef("");
  const stoppedRef = useRef(false);
  const detectedLangRef = useRef("");

  const stopAll = () => {
    stoppedRef.current = true;
    recsRef.current.forEach((r) => {
      try { r.stop(); } catch {}
    });
    recsRef.current = [];
  };

  const start = () => {
    if (listening) {
      stopAll();
      setListening(false);
      const fullText = finalTextRef.current.trim();
      if (fullText) onVoiceSend(fullText);
      finalTextRef.current = "";
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice is not supported in this browser, please open in Chrome");
      return;
    }

    stoppedRef.current = false;
    finalTextRef.current = "";
    detectedLangRef.current = "";
    recsRef.current = [];
    setListening(true);

    // Auto Detect - 3 ta vasha ek sathe sunbe
    const langs = ["en-IN", "bn-IN", "hi-IN"];

    langs.forEach((langCode) => {
      const rec = new SR();
      rec.lang = langCode;
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e: any) => {
        let finalText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalText += e.results[i][0].transcript;
          }
        }
        // Je vasha age dhorte parbe, oitai lock hoye jabe
        if (finalText && !detectedLangRef.current) {
          detectedLangRef.current = langCode;
          // Baki 2 to mic bondho kore de, jate gondogol na hoy
          recsRef.current.forEach((r) => {
            if (r !== rec) {
              try { r.stop(); } catch {}
            }
          });
        }
        if (finalText) {
          // Sudhu je vasha ta detect hoyeche, tar ta nibo
          if (!detectedLangRef.current || detectedLangRef.current === langCode) {
            finalTextRef.current += finalText + " ";
          }
        }
      };

      rec.onerror = () => {};
      rec.onend = () => {
        // Jodi nije theke bondho hoye jay ar amra stop korini, tahole abar chalu koro
        if (!stoppedRef.current && detectedLangRef.current === langCode) {
          try { rec.start(); } catch {}
        }
      };

      try {
        rec.start();
        recsRef.current.push(rec);
      } catch {}
    });
  };

  return (
    <button
      type="button"
      onClick={start}
      title={listening ? "Tap to Stop" : "Tap to Speak - Auto Language"}
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
      {listening ? "⏹️ Stop" : "🎤 Auto"}
    </button>
  );
}
