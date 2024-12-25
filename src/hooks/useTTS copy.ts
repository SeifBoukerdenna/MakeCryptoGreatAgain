// src/hooks/useTTS.ts

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Interface for specifying TTS voice configuration
 */
interface VoiceConfig {
  voiceId: string;
  engine?: string;
}

interface UseTTSResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  videoBlob: Blob | null;
  clearVideoBlob: () => void;
  sendTTSRequest: (
    text: string,
    voiceConfig: VoiceConfig,
    onStart?: () => void
  ) => void;
  audioRef: React.RefObject<HTMLAudioElement>;

  subtitles: string[];
  currentSubtitleIndex: number;
  audioDuration: number;
  setCurrentSubtitleIndex: React.Dispatch<React.SetStateAction<number>>;
}

//
// 1) Helper to split text into segments
//
function splitTextIntoSegments(text: string, segmentsCount: number): string[] {
  const words = text.split(/\s+/);
  const segmentSize = Math.ceil(words.length / segmentsCount);

  const segments: string[] = [];
  for (let i = 0; i < words.length; i += segmentSize) {
    segments.push(words.slice(i, i + segmentSize).join(" "));
  }
  return segments;
}

//
// 2) Word-wrap function
//
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

//
// 3) Draw bright subtitles
//
function drawSubtitle(ctx: CanvasRenderingContext2D, subtitleText: string) {
  const colorOptions = [
    "#FF5733",
    "#FFC300",
    "#DAF7A6",
    "#FF00FF",
    "#00FFFF",
    "#A020F0",
  ];
  const randColor =
    colorOptions[Math.floor(Math.random() * colorOptions.length)];
  const fontSize = Math.floor(Math.random() * 16) + 30; // 30–45

  ctx.save();

  // Optionally add a black outline for clarity:
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 6;
  ctx.font = `${fontSize}px Poppins, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw stroke behind text
  const xPos = ctx.canvas.width / 2;
  const yPos = ctx.canvas.height - 200;
  const maxWidth = ctx.canvas.width - 200;
  const lineHeight = fontSize * 1.2;

  wrapText(ctx, subtitleText, xPos, yPos, maxWidth, lineHeight);

  // Fill with bright color on top
  ctx.fillStyle = randColor;
  wrapText(ctx, subtitleText, xPos, yPos, maxWidth, lineHeight);

  ctx.restore();
}

//
// 4) The TTS Hook
//
export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Video recording state
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Subtitles
  const [subtitles, setSubtitles] = useState<string[]>([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const SUBTITLE_SEGMENTS_COUNT = 5;

  // Debug utility
  const playAudio = (audio: HTMLAudioElement) =>
    new Promise<void>((resolve, reject) => {
      audio.onplay = () => {
        console.log("[useTTS] audio.onplay called");
      };
      audio.onplaying = () => {
        console.log("[useTTS] audio.onplaying => actual playback started");
        resolve();
      };
      audio.onerror = () => {
        reject(new Error("Audio playback error"));
      };
      audio.play().catch((err) => reject(err));
    });

  // 1) Start the video recording
  const startVideoRecording = async () => {
    console.log("[useTTS] startVideoRecording called");
    if (!window.MediaRecorder) {
      console.warn("[useTTS] MediaRecorder is not supported in this browser.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("[useTTS] Unable to get 2D context from canvas.");
      }

      // 1080x1920 vertical
      canvas.width = 1080;
      canvas.height = 1920;

      // Attempt to get the avatar element
      const avatarElement = document.querySelector(
        ".selected-character-icon img"
      ) as HTMLImageElement;
      console.log("[useTTS] Found avatarElement:", avatarElement);

      if (!avatarElement) {
        console.warn("[useTTS] No avatar found, continuing anyway.");
      }

      const avatarImg = new Image();
      if (avatarElement) {
        avatarImg.crossOrigin = "anonymous";
        avatarImg.src = avatarElement.src;
        await new Promise<void>((resolve) => {
          avatarImg.onload = () => resolve();
        });
      }
      const avatarWidth = 400;
      const avatarHeight = 400;

      // Capture from canvas at 30 FPS
      const canvasStream = canvas.captureStream(30);

      // Combine with audio
      const audioStream = (audioRef.current as any)?.captureStream?.();
      if (!audioStream) {
        console.warn(
          "[useTTS] No audioRef or it doesn't support captureStream."
        );
        return;
      }

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      // Start MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp8,opus",
      });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("[useTTS] MediaRecorder stopped, building video blob");
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        console.log("[useTTS] videoBlob size:", blob.size);
        setVideoBlob(blob);
      };

      mediaRecorderRef.current.start();
      console.log("[useTTS] MediaRecorder started.");

      // Animate frames
      const animate = () => {
        if (!ctx || !mediaRecorderRef.current || !audioRef.current) return;

        const currentTime = audioRef.current.currentTime;
        const fraction = audioDuration
          ? Math.min(currentTime / audioDuration, 1)
          : 0;
        const index = Math.floor(fraction * subtitles.length);

        if (index !== currentSubtitleIndex) {
          console.log("[useTTS] updating currentSubtitleIndex:", index);
          setCurrentSubtitleIndex(index);
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw BG
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#F9FAFB");
        gradient.addColorStop(1, "#D946EF");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // White border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // If we have an avatar
        if (avatarElement) {
          const avatarX = (canvas.width - avatarWidth) / 2;
          const avatarY = 600;
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            avatarX + avatarWidth / 2,
            avatarY + avatarHeight / 2,
            avatarWidth / 2,
            0,
            2 * Math.PI
          );
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarWidth, avatarHeight);
          ctx.restore();

          // Simple pulse
          const pulse = Math.abs(Math.sin(Date.now() / 200)) * 20 + 20;
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            avatarY + avatarHeight / 2,
            Math.max(avatarWidth, avatarHeight) / 2 + pulse,
            0,
            2 * Math.PI
          );
          ctx.strokeStyle = "green";
          ctx.lineWidth = 10;
          ctx.stroke();
        }

        // Draw subtitle
        if (subtitles[currentSubtitleIndex]) {
          console.log(
            "[useTTS] Drawing subtitle:",
            subtitles[currentSubtitleIndex]
          );
          drawSubtitle(ctx, subtitles[currentSubtitleIndex]);
        }

        // Keep animating if still recording
        if (mediaRecorderRef.current.state === "recording") {
          requestAnimationFrame(animate);
        }
      };
      animate();
    } catch (err) {
      console.error("[useTTS] Error setting up video recording:", err);
    }
  };

  // 2) Stop video
  const stopVideoRecording = () => {
    console.log("[useTTS] stopVideoRecording called");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // 3) TTS Request
  const sendTTSRequest = useCallback(
    async (text: string, voiceConfig: VoiceConfig, onStart?: () => void) => {
      if (!text.trim()) return;
      console.log("[useTTS] sendTTSRequest text:", text);

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
          console.error("[useTTS] TTS response not ok:", errorData);
          throw new Error(errorData.error || "Failed to fetch TTS");
        }

        const audioBlob = await response.blob();
        const audioURL = URL.createObjectURL(audioBlob);

        let audio = audioRef.current;
        if (!audio) {
          audio = document.createElement("audio");
          audio.style.display = "none";
          document.body.appendChild(audio);
          audioRef.current = audio;
        }

        audio.crossOrigin = "anonymous";
        audio.src = audioURL;

        // Duration callback
        audio.onloadedmetadata = () => {
          console.log(
            "[useTTS] audio.onloadedmetadata => duration:",
            audio.duration
          );
          if (audio.duration) {
            setAudioDuration(audio.duration);
          }
        };

        // Make subtitles
        const newSubtitles = splitTextIntoSegments(
          text,
          SUBTITLE_SEGMENTS_COUNT
        );
        console.log("[useTTS] Subtitles created:", newSubtitles);
        setSubtitles(newSubtitles);
        setCurrentSubtitleIndex(0);

        // Play audio
        await playAudio(audio);
        setIsPlaying(true);
        onStart?.();

        // Start video
        await startVideoRecording();
      } catch (err: any) {
        console.error("[useTTS] TTS Error:", err.message);
        setError(err.message);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 4) End the recording when audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = () => {
      console.log("[useTTS] audio.onended => stopping video");
      setIsPlaying(false);
      stopVideoRecording();
      setCurrentSubtitleIndex(0);
    };
  }, [audioRef.current]);

  // 5) Clear video
  const clearVideoBlob = () => {
    console.log("[useTTS] clearVideoBlob called");
    setVideoBlob(null);
  };

  return {
    isLoading,
    isPlaying,
    error,
    videoBlob,
    clearVideoBlob,
    sendTTSRequest,
    audioRef,

    subtitles,
    currentSubtitleIndex,
    setCurrentSubtitleIndex,
    audioDuration,
  };
}
