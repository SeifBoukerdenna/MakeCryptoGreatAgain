// src/hooks/useDynamicCooldown.ts
import { useMcgaBalance } from "./useMcgaBalance";

const BASE_COOLDOWN_MS = 21600000; // 6 hours (21,600,000 ms)
const MAX_TOKEN_AMOUNT = 1000000; // 1M tokens for minimum cooldown
const MIN_COOLDOWN_MS = 1000; // Minimum 1 second cooldown
export function useDynamicCooldown() {
  const mcgaBalance = useMcgaBalance();

  const calculateCooldown = () => {
    // Cap the balance at MAX_TOKEN_AMOUNT
    const effectiveBalance = Math.min(mcgaBalance, MAX_TOKEN_AMOUNT);

    // Calculate percentage of max tokens held (0 to 1)
    const percentageOfMaxTokens = effectiveBalance / MAX_TOKEN_AMOUNT;

    // Linear interpolation between BASE_COOLDOWN_MS and MIN_COOLDOWN_MS
    const cooldown =
      BASE_COOLDOWN_MS -
      percentageOfMaxTokens * (BASE_COOLDOWN_MS - MIN_COOLDOWN_MS);

    return Math.max(Math.floor(cooldown), MIN_COOLDOWN_MS);
  };

  // Log the calculation for debugging
  console.log("Cooldown calculation:", {
    mcgaBalance,
    finalCooldown: calculateCooldown(),
  });

  const cooldown = calculateCooldown();

  return { dynamicCooldownMs: cooldown };
}
