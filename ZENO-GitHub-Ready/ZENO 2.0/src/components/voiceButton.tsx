import { useState, useRef } from "react";

export default function VoiceButton({ onVoiceSend }: { onVoiceSend: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const finalTextRef = useRef("");

  const start = () => {
    // Jodi already cholche, tahole STOP korbe
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

    rec.lang = "en-IN";
    rec.continuous = true; // Eitai main fix - thamleo off hobe na
    rec.interimResults = true; // Bolte bolte sunbe

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
      // Jodi kichu bole thakis, taholei send korbe
      if (fullText) {
        onVoiceSend(fullText);
      }
      finalTextRef.current = "";
    };

    rec.onerror = () => {
      setListening(false);
    };

    rec.start();
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
