// /src/hooks/useTTS.ts

import { useState, useRef } from "react";

interface UseTTSResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  sendTTSRequest: (text: string) => void;
}

export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sendTTSRequest = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stream-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "en_us_michael" }), // Replace with desired voice
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch TTS");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Audio playback error");
      };

      audio.play();
    } catch (err: any) {
      console.error("TTS Error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isPlaying, error, sendTTSRequest };
}
