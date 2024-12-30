// src/hooks/useTTS.ts

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceConfig {
  voiceId: string;
  engine?: string;
}

interface SubtitleSegment {
  text: string;
  color: string;
  font: string; // Added font property
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

  subtitleSegments: SubtitleSegment[];
  currentSubtitleIndex: number;
  audioDuration: number;
  setCurrentSubtitleIndex: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Creates an array of { text, color, font }.
 * If the text is empty, logs a warning and provides a fallback subtitle.
 */
function createSubtitleSegments(
  text: string,
  segmentsCount: number
): SubtitleSegment[] {
  console.log("[useTTS] createSubtitleSegments => raw text:", text);

  const words = text.trim().split(/\s+/);
  if (words.length === 0) {
    // console.warn(
    //   "[useTTS] No words found in TTS text. Using fallback subtitle."
    // );
    return [
      { text: "No TTS text found!", color: "#FF0000", font: "40px Arial" },
    ];
  }

  const segmentSize = Math.ceil(words.length / segmentsCount);

  // Expanded color options for more variety
  const colorOptions = [
    "#FF5733",
    "#FFC300",
    "#DAF7A6",
    "#FF00FF",
    "#00FFFF",
    "#A020F0",
    "#FF1493",
    "#32CD32",
    "#FFD700",
    "#1E90FF",
  ];

  // List of font styles to choose from
  const fontOptions = [
    "40px Poppins, sans-serif",
    "40px Arial, sans-serif",
    "40px 'Times New Roman', serif",
    "40px 'Courier New', monospace",
    "40px 'Georgia', serif",
    "40px 'Verdana', sans-serif",
    "40px 'Tahoma', sans-serif",
    "40px 'Trebuchet MS', sans-serif",
    "40px 'Lucida Console', monospace",
    "40px 'Impact', sans-serif",
  ];

  const segments: SubtitleSegment[] = [];
  for (let i = 0; i < words.length; i += segmentSize) {
    const chunk = words.slice(i, i + segmentSize).join(" ");
    const randColor =
      colorOptions[Math.floor(Math.random() * colorOptions.length)];
    const randFont =
      fontOptions[Math.floor(Math.random() * fontOptions.length)];
    const segment: SubtitleSegment = {
      text: chunk,
      color: randColor,
      font: randFont,
    };
    segments.push(segment);
    // console.log("[useTTS] Created segment:", segment);
  }

  // console.log("[useTTS] All created segments =>", segments);
  return segments;
}

/** Draws the text with fill and stroke at the bottom center of the canvas. */
function drawSubtitle(ctx: CanvasRenderingContext2D, segment: SubtitleSegment) {
  const { text, color, font } = segment;

  // Log the segment being drawn
  // console.log(
  //   "[useTTS] drawSubtitle => text:",
  //   text,
  //   "color:",
  //   color,
  //   "font:",
  //   font
  // );

  ctx.save();
  ctx.font = font; // Use the font from the segment
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Position near the bottom center
  const xPos = ctx.canvas.width / 2;
  const yPos = ctx.canvas.height - 200;

  // Validate color
  if (!color || typeof color !== "string") {
    // console.warn("[useTTS] Invalid color detected. Defaulting to white.");
    ctx.fillStyle = "#FFFFFF";
  } else {
    ctx.fillStyle = color;
  }

  // Fill text
  ctx.fillText(text || "MISSING TEXT", xPos, yPos);

  // Stroke outline
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000"; // Keep stroke as black for visibility
  ctx.strokeText(text || "MISSING TEXT", xPos, yPos);

  ctx.restore();
}

export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Subtitles
  const [subtitleSegments, setSubtitleSegments] = useState<SubtitleSegment[]>(
    []
  );
  const subtitleSegmentsRef = useRef<SubtitleSegment[]>([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const currentSubtitleIndexRef = useRef<number>(0);

  // Audio
  const [audioDuration, setAudioDuration] = useState(0);
  const audioDurationRef = useRef<number>(0); // New ref for audioDuration
  const SUBTITLE_SEGMENTS_COUNT = 5;

  // Sync subtitleSegments state to ref
  useEffect(() => {
    subtitleSegmentsRef.current = subtitleSegments;
    // console.log(
    //   "[useTTS] subtitleSegmentsRef updated:",
    //   subtitleSegmentsRef.current
    // );
  }, [subtitleSegments]);

  // Sync currentSubtitleIndex state to ref
  useEffect(() => {
    currentSubtitleIndexRef.current = currentSubtitleIndex;
  }, [currentSubtitleIndex]);

  // Sync audioDuration state to ref
  useEffect(() => {
    audioDurationRef.current = audioDuration;
  }, [audioDuration]);

  /** Ensures audio truly starts. */
  const playAudio = (audio: HTMLAudioElement) =>
    new Promise<void>((resolve, reject) => {
      audio.onplay = () =>
        // console.log("[useTTS] audio.onplay => user started playback");
        (audio.onplaying = () => {
          // console.log("[useTTS] audio.onplaying => actually playing");
          resolve();
        });
      audio.onerror = () => reject(new Error("Audio playback error"));
      audio.play().catch((err) => reject(err));
    });

  /** Starts video recording (canvas + audio). */
  /** Starts video recording (canvas + audio). */
  const startVideoRecording = async () => {
    if (!window.MediaRecorder) {
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("[useTTS] No 2D context from canvas");

      canvas.width = 1080;
      canvas.height = 1920;

      const avatarElement = document.querySelector(
        ".selected-character-icon img"
      ) as HTMLImageElement | null;

      // Get the character name element
      const characterNameElement = document.querySelector(
        ".selected-character-name"
      ) as HTMLElement | null;
      const characterName = characterNameElement?.textContent || "";

      // If avatar is found, load it
      const avatarImg = new Image();
      if (avatarElement) {
        avatarImg.crossOrigin = "anonymous";
        avatarImg.src = avatarElement.src;
        await new Promise<void>((resolve, reject) => {
          avatarImg.onload = () => resolve();
          avatarImg.onerror = () =>
            reject(new Error("[useTTS] Failed to load avatar image"));
        });
      }

      const canvasStream = canvas.captureStream(30);
      const audioStream = (audioRef.current as any)?.captureStream?.();
      if (!audioStream) {
        return;
      }

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp8,opus",
      });

      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        setVideoBlob(blob);
      };

      mediaRecorderRef.current.start();

      const avatarWidth = 400;
      const avatarHeight = 400;

      const animate = () => {
        if (!ctx || !mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state !== "recording") return;
        if (!audioRef.current) return;

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#F9FAFB");
        gradient.addColorStop(1, "#D946EF");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // White border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Avatar and name positioning
        if (avatarElement && avatarImg.complete) {
          const avatarX = (canvas.width - avatarWidth) / 2;
          const avatarY = 600;

          // Draw avatar with circular clip
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

          // Pulsing green ring
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

          // Draw character name
          if (characterName) {
            ctx.save();
            ctx.font = "bold 48px Poppins, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            // Draw text shadow (update the Y position to be higher)
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillText(
              characterName,
              canvas.width / 2 + 2,
              300 // Changed from avatarY + avatarHeight + 32
            );

            // Draw main text (update the Y position to match)
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillText(
              characterName,
              canvas.width / 2,
              298 // Changed from avatarY + avatarHeight + 30
            );
            ctx.restore();
          }
        }

        // Handle subtitles
        const audio = audioRef.current;
        const currentTime = audio.currentTime || 0;
        const duration = audioDurationRef.current;
        const fraction = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
        const rawIndex = Math.floor(
          fraction * subtitleSegmentsRef.current.length
        );
        const clampedIndex = Math.min(
          rawIndex,
          subtitleSegmentsRef.current.length - 1
        );

        if (clampedIndex !== currentSubtitleIndexRef.current) {
          setCurrentSubtitleIndex(clampedIndex);
        }

        // Draw subtitles
        const seg = subtitleSegmentsRef.current[clampedIndex];
        if (seg) {
          drawSubtitle(ctx, seg);
        } else {
          ctx.save();
          ctx.fillStyle = "#FF0000";
          ctx.font = "40px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            "No subtitle found!",
            canvas.width / 2,
            canvas.height - 200
          );
          ctx.restore();
        }

        requestAnimationFrame(animate);
      };
      animate();
    } catch (err) {
      console.error("[useTTS] Error starting video recording:", err);
    }
  };

  /** Stops video recording */
  const stopVideoRecording = () => {
    // console.log("[useTTS] stopVideoRecording called");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  /** Sends a TTS request: fetches audio, parses segments, starts playback and recording */
  const sendTTSRequest = useCallback(
    async (text: string, voiceConfig: VoiceConfig, onStart?: () => void) => {
      if (!text.trim()) {
        // console.warn("[useTTS] No text to speak!");
        return;
      }

      // console.log("[useTTS] sendTTSRequest => text:", text);
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
          console.error("[useTTS] TTS fetch error =>", errorData);
          throw new Error(errorData.error || "Failed to fetch TTS");
        }

        const audioBlob = await response.blob();
        const audioURL = URL.createObjectURL(audioBlob);

        // Create or reuse audio element
        let audio = audioRef.current;
        if (!audio) {
          audio = document.createElement("audio");
          audio.style.display = "none";
          document.body.appendChild(audio);
          audioRef.current = audio;
        }

        // Remove any existing 'ended' listeners to prevent multiple triggers
        audio.onended = null;

        audio.crossOrigin = "anonymous";
        audio.src = audioURL;

        // Define the handleEnded function
        const handleEnded = () => {
          // console.log("[useTTS] audio ended -> stop video");
          setIsPlaying(false);
          stopVideoRecording();
          setCurrentSubtitleIndex(0);
        };

        // Attach the 'ended' event listener
        audio.onended = handleEnded;

        // On metadata loaded
        audio.onloadedmetadata = () => {
          // console.log("[useTTS] onloadedmetadata => duration:", audio.duration);
          if (audio.duration) {
            setAudioDuration(audio.duration);
          } else {
            // console.warn("[useTTS] Audio duration is 0 or null");
          }
        };

        // Build subtitle segments
        const segments = createSubtitleSegments(text, SUBTITLE_SEGMENTS_COUNT);
        setSubtitleSegments(segments);
        setCurrentSubtitleIndex(0);

        // Start playback
        await playAudio(audio);
        onStart?.();
        setIsPlaying(true);

        // Start video recording
        await startVideoRecording();
      } catch (err: any) {
        // console.error("[useTTS] TTS Error =>", err.message);
        setError(err.message);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /** Clears the existing video Blob */
  const clearVideoBlob = () => {
    // console.log("[useTTS] clearVideoBlob called");
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

    subtitleSegments,
    currentSubtitleIndex,
    audioDuration,
    setCurrentSubtitleIndex,
  };
}
