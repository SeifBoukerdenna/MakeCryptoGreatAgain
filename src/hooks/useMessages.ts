// src/hooks/useMessages.ts

import { useState, useRef } from "react";
import { streamGPTResponse } from "../utils/openai";
import { useTTS } from "./useTTS";
import useConversationStore, { Message } from "../stores/useConversationStore";
import { useCharacterConfig } from "./useCharacterConfig";
import { useMessageStats } from "./useMessageStats";
import { supabase } from "../lib/supabase";
import { useWallet } from "@solana/wallet-adapter-react";
import useLanguageStore from "../stores/useLanguageStore";
import useTTSQueue from "./useTTSQueue";
import { toast } from "react-toastify";

export const useMessages = () => {
  const [loadingResponse, setLoadingResponse] = useState(false);
  const { systemPrompt, voiceId, voiceEngine, config } = useCharacterConfig();
  const {
    queuePosition,
    activeRequests,
    isProcessing,
    addToQueue,
    removeFromQueue,
  } = useTTSQueue();

  const {
    isPlaying,
    error: ttsError,
    sendTTSRequest,
    audioRef,
    videoBlob,
    clearVideoBlob,
  } = useTTS();

  const fullResponseRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { incrementMessageCount } = useMessageStats();
  const { publicKey } = useWallet();
  const { messages, addMessage, updateLastMessage } = useConversationStore();

  const { languages } = useLanguageStore();
  const characterLanguage = languages[config.id] || "english";

  const handleSend = async (userText: string) => {
    const userMessage: Message = {
      sender: "user",
      text: userText,
      status: "complete",
    };
    addMessage(userMessage);

    setLoadingResponse(true);
    fullResponseRef.current = "";

    // Build a dynamic prompt specifying the desired language
    const languageRequirement = `\n(Please respond strictly in ${characterLanguage}.)`;
    const finalSystemPrompt = systemPrompt + languageRequirement;

    addMessage({ sender: "character", text: "", status: "loading" });

    try {
      // Filter only relevant messages for context
      const contextMessages = messages.slice(-10).map((msg) => ({
        sender: msg.sender,
        text: msg.text,
      }));

      // Get GPT response
      await new Promise<void>((resolve, reject) => {
        streamGPTResponse(
          userText,
          finalSystemPrompt,
          JSON.stringify(contextMessages),
          (token: string) => {
            if (!token) return;

            const needsSpace =
              fullResponseRef.current.length > 0 &&
              !fullResponseRef.current.endsWith(" ") &&
              !token.startsWith(" ") &&
              !token.match(/^[.,!?;:)'"%\]}]/) &&
              !fullResponseRef.current.match(/[({\["'%]$/);

            fullResponseRef.current += (needsSpace ? " " : "") + token;
          }
        )
          .then(() => resolve())
          .catch(reject);
      });

      if (fullResponseRef.current) {
        updateLastMessage("", "loading");

        // Try to add to TTS queue
        const canProceed = await addToQueue();

        if (!canProceed) {
          if (queuePosition !== null) {
            toast.info(
              `You are in position ${queuePosition} in the queue. Please wait...`
            );
          }
          updateLastMessage(fullResponseRef.current, "complete");
          return;
        }

        try {
          await sendTTSRequest(
            fullResponseRef.current,
            { voiceId, engine: voiceEngine },
            () => {
              updateLastMessage(fullResponseRef.current, "playing");
            }
          );

          // Update database records
          if (publicKey) {
            try {
              const walletAddress = publicKey.toString();

              const { data: existingRecord } = await supabase
                .from("message_stats")
                .select("*")
                .eq("character_id", config.id)
                .eq("wallet_address", walletAddress)
                .single();

              if (existingRecord) {
                await supabase
                  .from("message_stats")
                  .update({
                    message_count: existingRecord.message_count + 1,
                    last_used: new Date().toISOString(),
                  })
                  .eq("id", existingRecord.id);
              } else {
                await supabase.from("message_stats").insert({
                  character_id: config.id,
                  wallet_address: walletAddress,
                  message_count: 1,
                  last_used: new Date().toISOString(),
                });
              }
            } catch (err) {
              console.error("Direct DB update error:", err);
            }
          }

          await incrementMessageCount(config.id);
        } finally {
          // Always remove from queue when done
          await removeFromQueue();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        sender: "character",
        text: "Oops! Something went wrong.",
        status: "complete",
      };
      addMessage(errorMessage);
      await removeFromQueue();
    } finally {
      setLoadingResponse(false);
      fullResponseRef.current = "";
    }
  };

  return {
    messages,
    loadingResponse,
    isPlaying,
    ttsError,
    messagesEndRef,
    handleSend,
    audioRef,
    videoBlob,
    clearVideoBlob,
    queuePosition,
    activeRequests,
    isProcessing,
  };
};
