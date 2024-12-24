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
  videoBlob: Blob | null;
  clearVideoBlob: () => void;
  sendTTSRequest: (
    text: string,
    voiceConfig: VoiceConfig,
    onStart?: () => void
  ) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useTTS(): UseTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the recorded video
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // We'll store the audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // For canvas + media recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  /**
   * Helper that returns a Promise that resolves once the browser
   * has actually started playing the audio.
   */
  const playAudio = (audio: HTMLAudioElement) =>
    new Promise<void>((resolve, reject) => {
      audio.onplay = () => {
        // "onplay" fires as soon as the `play()` call starts
        // but actual playing might still be blocked in some browsers.
        console.log("Audio started (onplay).");
      };
      audio.onplaying = () => {
        // "onplaying" is more reliable that the audio is actually playing
        console.log("Audio is playing (onplaying).");
        resolve();
      };
      audio.onerror = () => {
        reject(new Error("Audio playback error"));
      };

      audio.play().catch((err) => reject(err));
    });

  // 1) Function to set up a canvas and start video recording
  const startVideoRecording = async () => {
    if (!window.MediaRecorder) {
      console.warn("MediaRecorder API is not supported in your browser.");
      return;
    }

    try {
      // Create an offscreen canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to get canvas context");
      }

      // Dimensions for vertical format (like Reels/Shorts)
      canvas.width = 1080;
      canvas.height = 1920;

      // Grab the avatar from the DOM
      const avatarElement = document.querySelector(
        ".selected-character-icon img"
      ) as HTMLImageElement;
      if (!avatarElement) {
        throw new Error("Avatar element not found");
      }

      // Wait for the avatar image to load
      const avatarImg = new Image();
      avatarImg.crossOrigin = "anonymous"; // in case it's from another domain
      avatarImg.src = avatarElement.src;
      await new Promise<void>((resolve) => {
        avatarImg.onload = () => resolve();
      });

      // Prepare to draw each frame
      const avatarWidth = 300;
      const avatarHeight = 300;

      // Set up the canvas stream at 30 FPS
      const canvasStream = canvas.captureStream(30);

      // Combine with audio stream from the DOM-based audio element
      const audioStream = (audioRef.current as any)?.captureStream?.();
      if (!audioStream) {
        console.warn("No audioRef or audioRef stream not found.");
        return;
      }

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      // Confirm we have audio tracks
      console.log(
        "Audio tracks in combinedStream:",
        combinedStream.getAudioTracks()
      );

      // Set up the MediaRecorder
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
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        setVideoBlob(blob);
      };

      // Start recording
      mediaRecorderRef.current.start();

      // Simple pulsing animation around avatar
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the avatar
        ctx.drawImage(
          avatarImg,
          (canvas.width - avatarWidth) / 2,
          200,
          avatarWidth,
          avatarHeight
        );

        // Pulse effect
        const pulse = Math.abs(Math.sin(Date.now() / 200)) * 10 + 10;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          200 + avatarHeight / 2,
          Math.max(avatarWidth, avatarHeight) / 2 + pulse,
          0,
          2 * Math.PI
        );
        ctx.strokeStyle = "green";
        ctx.lineWidth = 5;
        ctx.stroke();

        if (mediaRecorderRef.current?.state === "recording") {
          requestAnimationFrame(animate);
        }
      };
      animate();
    } catch (err) {
      console.error("Error setting up video recording:", err);
    }
  };

  // 2) Stop the MediaRecorder
  const stopVideoRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // 3) TTS request that automatically starts/stops video
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

        // Create or re-use your <audio> element in the DOM
        let audio = audioRef.current;
        if (!audio) {
          // If we haven't created one yet, do it now
          audio = document.createElement("audio");
          // Hide it (or show controls for debugging)
          audio.style.display = "none";
          // You can do: audio.controls = true; to debug
          document.body.appendChild(audio);
          audioRef.current = audio;
        }

        // Make sure crossOrigin is set if TTS is from another domain
        audio.crossOrigin = "anonymous";

        // Load the newly fetched audio
        audio.src = audioURL;

        // We only proceed once the user has allowed playback
        await playAudio(audio);

        // The audio is definitely playing now
        setIsPlaying(true);
        onStart?.();

        // Start video recording automatically
        await startVideoRecording();
      } catch (err: any) {
        console.error("TTS Error:", err.message);
        setError(err.message);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Called once audio finishes outside (like user stops it, or it ends)
  // In practice, we track onended in the audioRef if we want to stop the recording
  // exactly when the audio ends. So let's do that:
  if (audioRef.current) {
    audioRef.current.onended = () => {
      console.log("Audio ended (onended).");
      setIsPlaying(false);
      stopVideoRecording();
    };
  }

  // Helper to close the preview in the parent
  const clearVideoBlob = () => {
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
  };
}
