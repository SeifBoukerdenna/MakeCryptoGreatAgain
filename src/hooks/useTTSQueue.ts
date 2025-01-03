// src/hooks/useTTSQueue.ts
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase";

interface QueueEntry {
  id: string;
  wallet_address: string;
  status: "waiting" | "processing" | "completed";
  created_at: string;
  updated_at: string;
}

export const useTTSQueue = () => {
  const { publicKey } = useWallet();
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const MAX_CONCURRENT_REQUESTS = 1; // Changed to 1 as per your requirement

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
      // Get active requests count
      const { data: processingData, error: processingError } = await supabase
        .from("tts_queue")
        .select("id")
        .eq("status", "processing");

      if (processingError) throw processingError;

      const processingCount = processingData?.length || 0;
      setActiveRequests(processingCount);

      // Check if the current user is processing
      const { data: userProcessing } = await supabase
        .from("tts_queue")
        .select("id")
        .eq("wallet_address", publicKey.toString())
        .eq("status", "processing");

      setIsProcessing(userProcessing && userProcessing.length > 0);

      // Get waiting queue if we're at max capacity
      if (processingCount >= MAX_CONCURRENT_REQUESTS) {
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

      // Get current processing count
      const { data: processingData } = await supabase
        .from("tts_queue")
        .select("id")
        .eq("status", "processing");

      const processingCount = processingData?.length || 0;

      // Add new request
      const { error: insertError } = await supabase.from("tts_queue").insert({
        wallet_address: publicKey.toString(),
        status:
          processingCount < MAX_CONCURRENT_REQUESTS ? "processing" : "waiting",
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
      // Get the current user's entry
      const { data: currentEntry } = await supabase
        .from("tts_queue")
        .select("*")
        .eq("wallet_address", publicKey.toString())
        .eq("status", "processing")
        .single();

      // Remove the current user from queue
      await supabase
        .from("tts_queue")
        .delete()
        .eq("wallet_address", publicKey.toString());

      // If we were processing, promote the next in line
      if (currentEntry) {
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

  return {
    queuePosition,
    activeRequests,
    isProcessing,
    addToQueue,
    removeFromQueue,
  };
};

export default useTTSQueue;
