// /src/hooks/useTTS.ts

import { useState, useRef } from "react";
import voices from "../configs/voices.json";

interface UseTTSResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  sendTTSRequest: (text: string, onStart?: () => void) => void;
}

export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioQueueRef = useRef<
    { audio: HTMLAudioElement; onStart?: () => void }[]
  >([]);
  const isProcessingRef = useRef(false);

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      isProcessingRef.current = false;
      return;
    }

    const { audio, onStart } = audioQueueRef.current.shift()!;
    setIsPlaying(true);

    // Call onStart callback when audio begins playing
    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audio.src);
      playNextInQueue();
    };

    audio.onerror = () => {
      setError("Audio playback error");
      setIsPlaying(false);
      URL.revokeObjectURL(audio.src);
      playNextInQueue();
    };

    audio.play().catch((err) => {
      console.error("Playback error:", err);
      setError("Failed to play audio");
      setIsPlaying(false);
      playNextInQueue();
    });
  };

  const sendTTSRequest = async (text: string, onStart?: () => void) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voices.trump.voice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch TTS");
      }

      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));

      audioQueueRef.current.push({ audio, onStart });

      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        playNextInQueue();
      }
    } catch (err: any) {
      console.error("TTS Error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isPlaying, error, sendTTSRequest };
}
