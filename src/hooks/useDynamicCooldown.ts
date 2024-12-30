// src/hooks/useDynamicCooldown.ts
import { useMcgaBalance } from "./useMcgaBalance";

const BASE_COOLDOWN_MS = 120000; // 2 minutes (120,000 ms)
const TOKEN_DENOMINATOR = 1000; // Every 1000 tokens
const REDUCTION_PER_TOKEN_GROUP = 10000; // 10 seconds (10,000 ms) per 1000 tokens
const MIN_COOLDOWN_MS = 1000; // Minimum 1 second cooldown

export function useDynamicCooldown() {
  const mcgaBalance = useMcgaBalance();

  // Calculate how many "token groups" the user has (each group is TOKEN_DENOMINATOR tokens)
  const tokenGroups = Math.floor(mcgaBalance / TOKEN_DENOMINATOR);

  // Calculate reduction (10 seconds per 1000 tokens)
  const reduction = tokenGroups * REDUCTION_PER_TOKEN_GROUP;

  // Calculate final cooldown with minimum limit
  const dynamicCooldownMs = Math.max(
    BASE_COOLDOWN_MS - reduction,
    MIN_COOLDOWN_MS
  );

  // Log the calculation for debugging
  console.log("Cooldown calculation:", {
    mcgaBalance,
    tokenGroups,
    reduction,
    finalCooldown: dynamicCooldownMs,
  });

  return { dynamicCooldownMs };
}
