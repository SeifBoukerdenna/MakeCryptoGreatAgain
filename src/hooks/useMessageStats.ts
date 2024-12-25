import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase";
import { charactersConfig } from "../configs/characters.config";

interface AggregatedCharacterStats {
  character_id: string;
  total_message_count: number;
  last_used: string;
  last_wallet_address: string;
  name: string;
  avatar: string;
}

export const useMessageStats = () => {
  const [characterStats, setCharacterStats] = useState<
    AggregatedCharacterStats[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useWallet();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("message_stats").select("*");

      if (error) throw error;

      // Aggregate data per character_id
      const aggregationMap: Record<string, AggregatedCharacterStats> = {};

      data.forEach((stat) => {
        const { character_id, message_count, last_used, wallet_address } = stat;
        if (!aggregationMap[character_id]) {
          aggregationMap[character_id] = {
            character_id,
            total_message_count: message_count,
            last_used,
            last_wallet_address: wallet_address,
            name: "Unknown Character",
            avatar: "",
          };
        } else {
          aggregationMap[character_id].total_message_count += message_count;
          // Update if this stat has a more recent last_used
          if (
            new Date(last_used) >
            new Date(aggregationMap[character_id].last_used)
          ) {
            aggregationMap[character_id].last_used = last_used;
            aggregationMap[character_id].last_wallet_address = wallet_address;
          }
        }
      });

      // Map character info from charactersConfig
      const aggregatedStats: AggregatedCharacterStats[] = Object.values(
        aggregationMap
      ).map((agg) => {
        const charConfig = charactersConfig.find(
          (char) => char.id === agg.character_id
        );
        return {
          ...agg,
          name: charConfig ? charConfig.name : "Unknown Character",
          avatar: charConfig ? charConfig.avatar : "",
        };
      });

      // Sort characters by total_message_count descending
      aggregatedStats.sort(
        (a, b) => b.total_message_count - a.total_message_count
      );

      setCharacterStats(aggregatedStats);
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
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116: No rows found
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
    // Set up real-time subscription if needed (optional)
    // For simplicity, omitted in this example
  }, [publicKey]);

  return {
    characterStats,
    isLoading,
    error,
    incrementMessageCount,
    refetchStats: fetchStats,
  };
};
