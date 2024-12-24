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

export const useMessages = () => {
  const [loadingResponse, setLoadingResponse] = useState(false);
  const { systemPrompt, voiceId, voiceEngine, config } = useCharacterConfig();
  const { isPlaying, error: ttsError, sendTTSRequest, audioRef } = useTTS();

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

    // 3) Build a dynamic prompt specifying the desired language
    //    so ChatGPT knows how to respond.
    //    You might tweak the phrasing as you wish.
    const languageRequirement = `\n(Please respond strictly in ${characterLanguage}.)`;

    // 4) For the final system prompt we send to GPT,
    //    we can combine systemPrompt + languageRequirement
    const finalSystemPrompt = systemPrompt + languageRequirement;

    // Insert a "loading" placeholder for the AI's upcoming response
    addMessage({ sender: "character", text: "", status: "loading" });

    try {
      await new Promise<void>((resolve, reject) => {
        // 5) Pass finalSystemPrompt to the streamGPTResponse
        streamGPTResponse(userText, finalSystemPrompt, (token: string) => {
          if (!token) return;

          const needsSpace =
            fullResponseRef.current.length > 0 &&
            !fullResponseRef.current.endsWith(" ") &&
            !token.startsWith(" ") &&
            !token.match(/^[.,!?;:)'"%\]}]/) &&
            !fullResponseRef.current.match(/[({\["'%]$/);

          fullResponseRef.current += (needsSpace ? " " : "") + token;
        })
          .then(() => resolve())
          .catch(reject);
      });

      if (fullResponseRef.current) {
        updateLastMessage("", "loading");

        await sendTTSRequest(
          fullResponseRef.current,
          { voiceId, engine: voiceEngine },
          () => {
            updateLastMessage(fullResponseRef.current, "playing");
          }
        );

        // Log attempt to increment message count
        console.log("Attempting to increment message count for:", {
          characterId: config.id,
          walletAddress: publicKey?.toString(),
        });

        // Direct database update for debugging
        if (publicKey) {
          try {
            const walletAddress = publicKey.toString();

            // First try to get existing record
            const { data: existingRecord } = await supabase
              .from("message_stats")
              .select("*")
              .eq("character_id", config.id)
              .eq("wallet_address", walletAddress)
              .single();

            if (existingRecord) {
              // Update existing record
              const { error: updateError } = await supabase
                .from("message_stats")
                .update({
                  message_count: existingRecord.message_count + 1,
                  last_used: new Date().toISOString(),
                })
                .eq("id", existingRecord.id);

              console.log("Update result:", updateError || "Success");
            } else {
              // Insert new record
              const { error: insertError } = await supabase
                .from("message_stats")
                .insert({
                  character_id: config.id,
                  wallet_address: walletAddress,
                  message_count: 1,
                  last_used: new Date().toISOString(),
                });

              console.log("Insert result:", insertError || "Success");
            }
          } catch (err) {
            console.error("Direct DB update error:", err);
          }
        }

        // Also call the local hook method
        await incrementMessageCount(config.id);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        sender: "character",
        text: "Oops! Something went wrong.",
        status: "complete",
      };
      addMessage(errorMessage);
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
  };
};
