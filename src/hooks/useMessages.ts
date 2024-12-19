// src/hooks/useMessages.ts

import { useRef, useState } from "react";
import { streamGPTResponse } from "../utils/openai";
import { useTTS } from "./useTTS";
import useConversationStore, { Message } from "../stores/useConversationStore";

export const useMessages = () => {
  const [loadingResponse, setLoadingResponse] = useState(false);
  const { isPlaying, error: ttsError, sendTTSRequest } = useTTS();
  const fullResponseRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, updateLastMessage } = useConversationStore();

  const handleSend = async (userText: string) => {
    const userMessage: Message = {
      sender: "user",
      text: userText,
      status: "complete",
    };
    addMessage(userMessage);

    setLoadingResponse(true);
    fullResponseRef.current = "";

    addMessage({ sender: "character", text: "", status: "loading" });

    try {
      await new Promise<void>((resolve, reject) => {
        streamGPTResponse(userText, (token: string) => {
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

        await sendTTSRequest(fullResponseRef.current, () => {
          updateLastMessage(fullResponseRef.current, "playing");
        });
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
  };
};
