import { RecordingSetup } from "../types/video";

const renderSubtitlesOnCanvas = (
  ctx: CanvasRenderingContext2D,
  text: string,
  progress: number,
  canvasHeight: number
): void => {
  const words = text.split(" ");
  const currentWordIndex = Math.floor(progress * words.length);
  const visibleWords = words.slice(0, currentWordIndex + 1);

  // Text styling
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "24px Poppins";

  // Calculate total width to center align
  let totalWidth = 0;
  const wordPositions: number[] = [];

  visibleWords.forEach((word) => {
    const width = ctx.measureText(word + " ").width;
    wordPositions.push(totalWidth);
    totalWidth += width;
  });

  // Starting position for first word
  const startX = (ctx.canvas.width - totalWidth) / 2;
  const y = canvasHeight - 150; // Position above bottom

  // Render each word with effects
  visibleWords.forEach((word, i) => {
    const isCurrent = i === currentWordIndex;
    const x = startX + wordPositions[i];

    // Style based on word state
    if (isCurrent) {
      ctx.font = "bold 32px Poppins";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
    } else {
      ctx.font = "24px Poppins";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowBlur = 2;
    }

    ctx.fillText(word + " ", x, y);
  });

  // Reset shadow
  ctx.shadowBlur = 0;
};

export const startVideoRecordingWithSubtitles = async (
  avatarImg: HTMLImageElement,
  audioRef: HTMLAudioElement,
  fullText: string
): Promise<RecordingSetup> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas context");

  // Set dimensions for vertical format
  canvas.width = 1080;
  canvas.height = 1920;

  // Avatar dimensions
  const avatarWidth = 400;
  const avatarHeight = 400;
  const avatarY = 600;

  // Set up canvas stream
  const canvasStream = canvas.captureStream(30);
  const audioStream = (audioRef as any).captureStream?.();

  if (!audioStream) {
    throw new Error("Audio stream not available");
  }

  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);

  // Set up MediaRecorder
  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: "video/webm; codecs=vp8,opus",
  });

  const recordedChunks: Blob[] = [];
  mediaRecorder.ondataavailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  // Animation frame variables
  let startTime: number | null = null;
  const totalDuration = audioRef.duration;
  let animationFrameId: number;

  // Animation loop
  const animate = (timestamp: number): void => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min(
      (timestamp - startTime) / (totalDuration * 1000),
      1
    );

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#F9FAFB");
    gradient.addColorStop(1, "#D946EF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Avatar
    const avatarX = (canvas.width - avatarWidth) / 2;

    // Circular clipping for avatar
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

    // Pulse effect
    const pulse = Math.abs(Math.sin(timestamp / 200)) * 20 + 20;
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

    // Render subtitles
    renderSubtitlesOnCanvas(ctx, fullText, progress, canvas.height);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    }
  };

  // Start recording
  mediaRecorder.start();
  animationFrameId = requestAnimationFrame(animate);

  return {
    mediaRecorder,
    recordedChunks,
    stopRecording: () => {
      cancelAnimationFrame(animationFrameId);
      mediaRecorder.stop();
    },
  };
};
