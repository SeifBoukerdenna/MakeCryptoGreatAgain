// src/hooks/useDynamicCooldown.ts
import { useMcgaBalance } from "./useMcgaBalance";

/**
 * Example: The user starts with a 6-second cooldown (6000 ms),
 * and for each MCGA token they hold, we reduce the cooldown by 100 ms,
 * down to a minimum of 1 second.
 */
const BASE_COOLDOWN_MS = 6000; // 6 seconds
const PER_TOKEN_REDUCTION = 100; // reduce 0.1s per token
const MIN_COOLDOWN_MS = 1000; // 1 second

export function useDynamicCooldown() {
  const mcgaBalance = useMcgaBalance();

  // Example formula:
  const dynamicCooldownMs = Math.max(
    BASE_COOLDOWN_MS - mcgaBalance * PER_TOKEN_REDUCTION,
    MIN_COOLDOWN_MS
  );

  return { dynamicCooldownMs };
}
