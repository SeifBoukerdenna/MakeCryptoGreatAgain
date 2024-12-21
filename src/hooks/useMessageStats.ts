// src/hooks/useMessageStats.ts
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase";
import type { MessageStat } from "../lib/supabase";
import { charactersConfig } from "../configs/characters.config";

interface CharacterStats extends MessageStat {
  name: string;
  avatar: string;
}

export const useMessageStats = () => {
  const [characterStats, setCharacterStats] = useState<CharacterStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useWallet();

  // Fetch stats for all characters
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("message_stats")
        .select("*")
        .order("message_count", { ascending: false });

      if (error) throw error;

      // Combine with character info
      const statsWithCharInfo = data.map((stat) => ({
        ...stat,
        ...(charactersConfig.find((char) => char.id === stat.character_id) || {
          name: "Unknown Character",
          avatar: "",
        }),
      }));

      setCharacterStats(statsWithCharInfo);
    } catch (err) {
      console.error("Error fetching message stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoading(false);
    }
  };

  // Increment message count for a character
  const incrementMessageCount = async (characterId: string) => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();

    try {
      // Try to update existing record
      const { data, error: fetchError } = await supabase
        .from("message_stats")
        .select("*")
        .eq("character_id", characterId)
        .eq("wallet_address", walletAddress)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (data) {
        // Update existing record
        const { error } = await supabase
          .from("message_stats")
          .update({
            message_count: data.message_count + 1,
            last_used: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from("message_stats").insert({
          character_id: characterId,
          wallet_address: walletAddress,
          message_count: 1,
          last_used: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error("Error updating message count:", err);
    }
  };

  // Fetch stats on mount and when wallet changes
  useEffect(() => {
    fetchStats();
  }, [publicKey]);

  return {
    characterStats,
    isLoading,
    error,
    incrementMessageCount,
    refetchStats: fetchStats,
  };
};
