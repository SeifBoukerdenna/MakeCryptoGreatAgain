// src/utils/time.ts

export function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = "";
  if (hours > 0) {
    formatted += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    // Show minutes if there are hours or minutes
    formatted += `${minutes}m `;
  }
  formatted += `${seconds}s`;

  return formatted.trim();
}
