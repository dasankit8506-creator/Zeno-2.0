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
      recorder.ondataavailable = (e: any) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
         const transcribe = async (blob: Blob) => {
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64 }),
      });
      const data = await res.json();
      setProcessing(false);
      if (data.text) onVoiceSend(data.text);
      else alert("Error: " + (data.error || "Could not hear"));
    } catch (e: any) {
      setProcessing(false);
      alert("Voice failed: " + e.message);
    }
  };
