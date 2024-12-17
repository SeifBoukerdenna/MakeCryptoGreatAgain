// useTTS.ts
import { useState, useEffect, useRef } from "react";
import voices from "../configs/voices.json";

interface UseTTSResult {
  isLoading: boolean;
  error: string | null;
  sendTTSRequest: (text: string) => void;
}

async function getWebSocketUrl() {
  const response = await fetch("/api/websocket-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to get WebSocket URL");
  }
  const data = await response.json();
  return data.websocket_urls["PlayDialog"];
}

export function useTTS(
  authToken: string,
  userId: string,
  defaultVoice: string
): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Uint8Array[]>([]); // To store chunks until SourceBuffer is ready
  const isSourceBufferReady = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const wsUrl = await getWebSocketUrl();
        if (!isMounted) return;

        // Prepare an Audio element and MediaSource for streaming
        const audio = new Audio();
        audioRef.current = audio;
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        audio.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener("sourceopen", () => {
          sourceBufferRef.current = mediaSource.addSourceBuffer("audio/mpeg");
          sourceBufferRef.current.addEventListener("updateend", () => {
            // Append more data if queued
            if (
              queueRef.current.length > 0 &&
              !sourceBufferRef.current?.updating
            ) {
              const chunk = queueRef.current.shift();
              if (chunk && sourceBufferRef.current) {
                sourceBufferRef.current.appendBuffer(chunk);
              }
            }
          });
          isSourceBufferReady.current = true;
        });

        const ws = new WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
          console.log("WebSocket connected to Play.ht");
        };

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Received binary audio data chunk
            console.log("Received binary chunk", event.data.byteLength);
            const chunk = new Uint8Array(event.data);
            if (
              isSourceBufferReady.current &&
              sourceBufferRef.current &&
              !sourceBufferRef.current.updating
            ) {
              sourceBufferRef.current.appendBuffer(chunk);
              // Start playing as soon as we have some data
              if (audio.paused) {
                audio
                  .play()
                  .catch((err) => console.error("Audio play error:", err));
              }
            } else {
              // SourceBuffer not ready or busy, queue the chunk
              queueRef.current.push(chunk);
            }
          } else {
            // JSON message
            const msg = JSON.parse(event.data);
            console.log("Received JSON message:", msg);
            if (msg.type === "start") {
              // New TTS request started
              setIsLoading(true);
            } else if (msg.type === "end") {
              // TTS request ended
              setIsLoading(false);
              // Note: You may choose to do something here, or wait for the next request.
              // The audio might continue playing if there's more queued data.
              // Once done, you can optionally reset MediaSource if you want to start fresh.
            }
          }
        };

        ws.onerror = (e) => {
          console.error("WebSocket error:", e);
          setError("WebSocket error occurred");
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
        };

        wsRef.current = ws;
      } catch (err: unknown) {
        console.error("Error getting WebSocket URL:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      }
    })();

    return () => {
      isMounted = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [authToken, userId, defaultVoice]);

  const sendTTSRequest = (text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not open");
      return;
    }

    // Each TTS request resets the audio buffer in this simplistic example.
    // If you want continuous conversation, you might append multiple requests back-to-back.
    if (
      mediaSourceRef.current &&
      mediaSourceRef.current.readyState === "open" &&
      sourceBufferRef.current
    ) {
      // Reset if needed. The simplest way:
      // Close and re-initialize the MediaSource each time you send a new request if you want a fresh audio stream.
      // Otherwise, just keep appending and playing continuously.
      // For now, let's just keep it continuous.
    }

    const ttsCommand = {
      text,
      voice: voices.trump.voice,
      output_format: "mp3",
    };
    ws.send(JSON.stringify(ttsCommand));
  };

  return { isLoading, error, sendTTSRequest };
}
