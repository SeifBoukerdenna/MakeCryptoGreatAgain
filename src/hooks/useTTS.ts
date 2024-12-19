// src/hooks/useTTS.ts

import { useState, useRef, useCallback } from "react";

interface VoiceConfig {
  voiceId: string;
  engine?: string;
}

interface UseTTSResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  sendTTSRequest: (
    text: string,
    voiceConfig: VoiceConfig,
    onStart?: () => void
  ) => void;
}

export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sendTTSRequest = useCallback(
    async (text: string, voiceConfig: VoiceConfig, onStart?: () => void) => {
      if (!text.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: voiceConfig.voiceId,
            engine: voiceConfig.engine,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch TTS");
        }

        const audioBlob = await response.blob();
        const audioURL = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioURL);

        audioRef.current = audio;
        setIsPlaying(true);

        // Callback when audio starts playing
        audio.onplay = () => {
          console.log("Audio started playing.");
          onStart?.();
        };

        // Callback when audio ends
        audio.onended = () => {
          console.log("Audio ended.");
          setIsPlaying(false);
          URL.revokeObjectURL(audioURL);
        };

        // Callback on audio error
        audio.onerror = () => {
          console.error("Audio playback error");
          setError("Audio playback error");
          setIsPlaying(false);
          URL.revokeObjectURL(audioURL);
        };

        await audio.play();
      } catch (err: any) {
        console.error("TTS Error:", err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, isPlaying, error, sendTTSRequest };
}
