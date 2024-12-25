import { colorOptions, fontOptions } from "../constants/subtitles";
import { SubtitleSegment } from "../types/subtitles-types";

/**
 * Creates an array of { text, color, font }.
 * If the text is empty, logs a warning and provides a fallback subtitle.
 */
export function createSubtitleSegments(
  text: string,
  segmentsCount: number
): SubtitleSegment[] {
  console.log("[useTTS] createSubtitleSegments => raw text:", text);

  const words = text.trim().split(/\s+/);
  if (words.length === 0) {
    console.warn(
      "[useTTS] No words found in TTS text. Using fallback subtitle."
    );
    return [
      { text: "No TTS text found!", color: "#FF0000", font: "40px Arial" },
    ];
  }

  const segmentSize = Math.ceil(words.length / segmentsCount);

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
      font: `${randFont.style} ${randFont.size} ${randFont.family}`, // Combine style, size, and family
    };
    segments.push(segment);
    console.log("[useTTS] Created segment:", segment);
  }

  console.log("[useTTS] All created segments =>", segments);
  return segments;
}

export /** Draws the text with fill and stroke at the bottom center of the canvas. */
function drawSubtitle(ctx: CanvasRenderingContext2D, segment: SubtitleSegment) {
  const { text, color, font } = segment;

  // Log the segment being drawn
  console.log(
    "[useTTS] drawSubtitle => text:",
    text,
    "color:",
    color,
    "font:",
    font
  );

  ctx.save();
  ctx.font = font; // Use the font from the segment
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Position near the bottom center
  const xPos = ctx.canvas.width / 2;
  const yPos = ctx.canvas.height - 200;

  // Validate color
  if (!color || typeof color !== "string") {
    console.warn("[useTTS] Invalid color detected. Defaulting to white.");
    ctx.fillStyle = "#FFFFFF";
  } else {
    ctx.fillStyle = color;
  }

  // Optional: Add text shadow for better visibility
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;

  // Fill text
  ctx.fillText(text || "MISSING TEXT", xPos, yPos);

  // Stroke outline
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000"; // Keep stroke as black for visibility
  ctx.strokeText(text || "MISSING TEXT", xPos, yPos);

  ctx.restore();
}
