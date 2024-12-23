// src/hooks/useChallengeLogic.ts

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDynamicCooldown } from "./useDynamicCooldown";

export interface CharacterChallenge {
  character_id: string;
  wallet_address: string;
  success: boolean;
  last_attempt: string | null;
  attempts: number;
}

export function useChallengeLogic() {
  const { connected, publicKey } = useWallet();
  // Our dynamic cooldown from MCGA tokens
  const { dynamicCooldownMs } = useDynamicCooldown();

  // States
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, Date>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [winners, setWinners] = useState<Record<string, string>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // 1. Timer to refresh cooldowns every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => ({ ...prev }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Clean up expired cooldowns and clear results for expired cooldowns
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCooldowns((prevCooldowns) => {
        const now = Date.now();
        const newCooldowns: Record<string, Date> = {};
        const expiredIds: string[] = [];

        Object.entries(prevCooldowns).forEach(([id, date]) => {
          // Instead of a static COOL_DOWN, use dynamicCooldownMs
          if (now - date.getTime() < dynamicCooldownMs) {
            newCooldowns[id] = date;
          } else {
            expiredIds.push(id);
          }
        });

        if (expiredIds.length > 0) {
          setResults((prevResults) => {
            const updatedResults = { ...prevResults };
            expiredIds.forEach((id) => {
              delete updatedResults[id];
            });
            return updatedResults;
          });
        }

        return newCooldowns;
      });
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [dynamicCooldownMs]);

  // 3. If user changes, fetch cooldowns
  useEffect(() => {
    if (publicKey) {
      fetchUserCooldowns();
    } else {
      setCooldowns({});
    }
  }, [publicKey]);

  // 4. Re-fetch total attempts whenever a guess is submitted
  useEffect(() => {
    fetchTotalAttempts();
  }, [submittingId]);

  // 5. Realtime subscription + fetch winners
  useEffect(() => {
    fetchWinners();
    const subscription = supabase
      .channel("character_challenges")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "character_challenges" },
        (payload) => {
          console.log("INSERT payload:", payload);
          const newRecord = payload.new as CharacterChallenge;
          if (newRecord.success) {
            setWinners((prev) => ({
              ...prev,
              [newRecord.character_id]: newRecord.wallet_address,
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "character_challenges" },
        (payload) => {
          console.log("UPDATE payload:", payload);
          const updatedRecord = payload.new as CharacterChallenge;
          if (updatedRecord.success) {
            setWinners((prev) => ({
              ...prev,
              [updatedRecord.character_id]: updatedRecord.wallet_address,
            }));
          }
        }
      )
      .subscribe();

    const interval = setInterval(fetchWinners, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [dynamicCooldownMs]); // or just [] if you prefer

  // -- Supabase data fetching --

  async function fetchUserCooldowns() {
    if (!publicKey) return;
    const { data, error } = await supabase
      .from("character_challenges")
      .select("character_id, last_attempt")
      .eq("wallet_address", publicKey.toString());

    if (error) {
      console.error("Error fetching cooldowns:", error);
      return;
    }
    if (data) {
      const newCooldowns: Record<string, Date> = {};
      data.forEach((record: any) => {
        if (record.last_attempt) {
          const attemptDate = new Date(record.last_attempt);
          newCooldowns[record.character_id] = attemptDate;
        }
      });
      setCooldowns(newCooldowns);
    }
  }

  async function fetchTotalAttempts() {
    const { data, error } = await supabase
      .from("character_challenges")
      .select("attempts");

    if (error) {
      console.error("Error fetching total attempts:", error);
      return;
    }
    if (data && Array.isArray(data)) {
      const total = data.reduce(
        (acc: number, row: any) => acc + (row.attempts || 0),
        0
      );
      setTotalAttempts(total);
    }
  }

  async function fetchWinners() {
    try {
      const { data, error } = await supabase
        .from("character_challenges")
        .select("*")
        .eq("success", true)
        .order("last_attempt", { ascending: false });

      if (error) throw error;
      if (data) {
        const winnersMap: Record<string, string> = {};
        data.forEach((record: CharacterChallenge) => {
          const { character_id, wallet_address } = record;
          if (!winnersMap[character_id]) {
            winnersMap[character_id] = wallet_address;
          }
        });
        setWinners(winnersMap);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
    }
  }

  // -- handleGuess, handleCopy, getCooldownRemaining, etc. --

  async function handleGuess(characterId: string) {
    if (!publicKey || !connected) return;
    if (winners[characterId]) return;

    const lastAttempt = cooldowns[characterId];
    if (lastAttempt && Date.now() - lastAttempt.getTime() < dynamicCooldownMs) {
      return;
    }

    setIsLoading(true);
    setSubmittingId(characterId);

    try {
      // 1. fetch secret
      const { data: secretData, error } = await supabase
        .from("character_secrets")
        .select("secret")
        .eq("character_id", characterId)
        .single();
      if (error) throw error;
      if (!secretData) return;

      // 2. compare
      const userGuess = guesses[characterId]?.trim().toLowerCase() || "";
      const correctAnswer = secretData.secret.trim().toLowerCase();
      const isCorrect = userGuess === correctAnswer;
      setResults((prev) => ({ ...prev, [characterId]: isCorrect }));

      // 3. get existing
      const { data: existing, error: existingError } = await supabase
        .from("character_challenges")
        .select("*")
        .eq("wallet_address", publicKey.toString())
        .eq("character_id", characterId)
        .single();

      let currentAttempts = 0;
      if (!existingError && existing) {
        currentAttempts = existing.attempts || 0;
      }

      // 4. upsert
      const upsertData: any = {
        wallet_address: publicKey.toString(),
        character_id: characterId,
        success: isCorrect,
        attempts: currentAttempts + 1,
        last_attempt: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase
        .from("character_challenges")
        .upsert(upsertData, { onConflict: "wallet_address,character_id" });
      if (upsertError) throw upsertError;

      // 5. local states
      if (!isCorrect) {
        setCooldowns((prev) => ({
          ...prev,
          [characterId]: new Date(),
        }));
        setGuesses((prev) => ({
          ...prev,
          [characterId]: "",
        }));
      } else {
        // correct => remove from cooldown & optimistic update
        setCooldowns((prev) => {
          const { [characterId]: _, ...rest } = prev;
          return rest;
        });
        setWinners((prev) => ({
          ...prev,
          [characterId]: publicKey.toString(),
        }));
      }

      // 6. refresh attempts
      await fetchTotalAttempts();
    } catch (err) {
      console.error("Error submitting guess:", err);
    } finally {
      setIsLoading(false);
      setSubmittingId(null);
    }
  }

  function getCooldownRemaining(characterId: string) {
    const lastAttempt = cooldowns[characterId];
    if (!lastAttempt) return 0;
    const timePassed = Date.now() - lastAttempt.getTime();
    return Math.max(dynamicCooldownMs - timePassed, 0);
  }

  async function handleCopy(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedStates((prev) => ({ ...prev, [address]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [address]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }

  // Return everything needed by the UI
  return {
    guesses,
    setGuesses,
    cooldowns,
    results,
    isLoading,
    submittingId,
    totalAttempts,
    winners,
    copiedStates,

    handleGuess,
    handleCopy,
    getCooldownRemaining,
  };
}
