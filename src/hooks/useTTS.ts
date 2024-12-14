// src/hooks/useTTS.ts

import { useState, useCallback } from "react";

interface UseTTSResult {
  isLoading: boolean;
  error: string | null;
  generateAudio: (text: string, voice?: string) => Promise<void>;
}

export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAudio = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice:
            "s3://voice-cloning-zero-shot/9f6080a2-c6c6-4a5a-a101-17b354087b68/original/manifest.json",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }

      const { audioBase64 } = await response.json();
      // Create a blob URL from the base64 data
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err: unknown) {
      console.error("Error generating audio:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, generateAudio };
}
