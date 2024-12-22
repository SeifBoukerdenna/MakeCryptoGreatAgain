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

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("message_stats")
        .select("*")
        .order("message_count", { ascending: false });

      if (error) throw error;

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

  const incrementMessageCount = async (characterId: string) => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();

    try {
      // First, try to get the existing record
      const { data: existingRecord, error: fetchError } = await supabase
        .from("message_stats")
        .select("*")
        .eq("character_id", characterId)
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing record:", fetchError);
        return;
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("message_stats")
          .update({
            message_count: existingRecord.message_count + 1,
            last_used: new Date().toISOString(),
          })
          .eq("character_id", characterId)
          .eq("wallet_address", walletAddress);

        if (updateError) {
          console.error("Error updating count:", updateError);
          return;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("message_stats")
          .insert({
            character_id: characterId,
            wallet_address: walletAddress,
            message_count: 1,
            last_used: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error inserting new record:", insertError);
          return;
        }
      }

      // Refresh stats after successful update
      await fetchStats();
    } catch (err) {
      console.error("Error updating message count:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    // Set up real-time subscription
    const subscription = supabase
      .channel("message_stats_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_stats" },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [publicKey]);

  return {
    characterStats,
    isLoading,
    error,
    incrementMessageCount,
    refetchStats: fetchStats,
  };
};
