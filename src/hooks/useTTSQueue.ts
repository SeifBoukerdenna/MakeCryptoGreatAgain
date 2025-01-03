// src/hooks/useTTSQueue.ts
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase";

export const useTTSQueue = () => {
  const { publicKey } = useWallet();
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const MAX_REQUESTS_PER_MINUTE = 5;

  useEffect(() => {
    if (!publicKey) return;

    // Subscribe to queue changes
    const subscription = supabase
      .channel("tts_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tts_queue" },
        handleQueueChange
      )
      .subscribe();

    // Initial queue check
    checkQueueStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, [publicKey]);

  const handleQueueChange = async () => {
    await checkQueueStatus();
  };

  const checkQueueStatus = async () => {
    if (!publicKey) return;

    try {
      // Get one-minute-old timestamp
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

      // Count requests in the last minute
      const { data: recentData } = await supabase
        .from("tts_queue")
        .select("id")
        .gte("created_at", oneMinuteAgo.toISOString())
        .order("created_at", { ascending: false });

      const recentCount = recentData?.length || 0;
      setActiveRequests(recentCount);

      // Check if current user is currently processing
      const { data: userProcessing } = await supabase
        .from("tts_queue")
        .select("id")
        .eq("wallet_address", publicKey.toString())
        .eq("status", "processing")
        .single();

      setIsProcessing(!!userProcessing);

      // If we're at or over the limit, check queue position
      if (recentCount >= MAX_REQUESTS_PER_MINUTE) {
        const { data: waitingData } = await supabase
          .from("tts_queue")
          .select("wallet_address")
          .eq("status", "waiting")
          .order("created_at", { ascending: true });

        if (waitingData) {
          const position = waitingData.findIndex(
            (entry) => entry.wallet_address === publicKey.toString()
          );
          setQueuePosition(position !== -1 ? position + 1 : null);
        } else {
          setQueuePosition(null);
        }
      } else {
        setQueuePosition(null);
      }
    } catch (error) {
      console.error("Error checking queue status:", error);
    }
  };

  const addToQueue = async (): Promise<boolean> => {
    if (!publicKey) return false;

    try {
      // Check for existing requests from this user
      const { data: existingData } = await supabase
        .from("tts_queue")
        .select("id")
        .eq("wallet_address", publicKey.toString())
        .in("status", ["waiting", "processing"]);

      if (existingData && existingData.length > 0) {
        console.log("User already has an active request");
        return false;
      }

      // Get one-minute-old timestamp
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

      // Count requests in the last minute
      const { data: recentData } = await supabase
        .from("tts_queue")
        .select("id")
        .gte("created_at", oneMinuteAgo.toISOString());

      const recentCount = recentData?.length || 0;

      // Add new request
      const { error: insertError } = await supabase.from("tts_queue").insert({
        wallet_address: publicKey.toString(),
        status:
          recentCount < MAX_REQUESTS_PER_MINUTE ? "processing" : "waiting",
      });

      if (insertError) throw insertError;

      await checkQueueStatus();
      return true;
    } catch (error) {
      console.error("Error adding to queue:", error);
      return false;
    }
  };

  const removeFromQueue = async () => {
    if (!publicKey) return;

    try {
      // Remove the current user's entry
      await supabase
        .from("tts_queue")
        .delete()
        .eq("wallet_address", publicKey.toString());

      // Check if we can promote someone from the waiting list
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

      const { data: recentData } = await supabase
        .from("tts_queue")
        .select("id")
        .gte("created_at", oneMinuteAgo.toISOString());

      const recentCount = recentData?.length || 0;

      if (recentCount < MAX_REQUESTS_PER_MINUTE) {
        const { data: nextInQueue } = await supabase
          .from("tts_queue")
          .select("*")
          .eq("status", "waiting")
          .order("created_at", { ascending: true })
          .limit(1);

        if (nextInQueue && nextInQueue.length > 0) {
          await supabase
            .from("tts_queue")
            .update({ status: "processing" })
            .eq("id", nextInQueue[0].id);
        }
      }

      await checkQueueStatus();
    } catch (error) {
      console.error("Error removing from queue:", error);
    }
  };

  // Calculate time until next available slot
  const getTimeUntilNextSlot = async (): Promise<number> => {
    const { data } = await supabase
      .from("tts_queue")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_REQUESTS_PER_MINUTE);

    if (data && data.length >= MAX_REQUESTS_PER_MINUTE) {
      const oldestTimestamp = new Date(data[data.length - 1].created_at);
      const timeUntilExpiry = 60000 - (Date.now() - oldestTimestamp.getTime());
      return Math.max(0, timeUntilExpiry);
    }
    return 0;
  };

  return {
    queuePosition,
    activeRequests,
    isProcessing,
    addToQueue,
    removeFromQueue,
    getTimeUntilNextSlot,
  };
};

export default useTTSQueue;
