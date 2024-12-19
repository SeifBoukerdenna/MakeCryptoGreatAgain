// src/stores/useConversationStore.ts

import { create } from "zustand";

export interface Message {
  sender: "user" | "character";
  text: string;
  status: "loading" | "playing" | "complete";
}

interface ConversationState {
  messages: Message[];
  addMessage: (message: Message) => void;
  updateLastMessage: (text: string, status: Message["status"]) => void;
  setMessages: (messages: Message[]) => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateLastMessage: (text, status) =>
    set((state) => {
      const updated = [...state.messages];
      const lastMessage = updated[updated.length - 1];
      if (lastMessage && lastMessage.sender === "character") {
        lastMessage.text = text;
        lastMessage.status = status;
      }
      return { messages: updated };
    }),
  setMessages: (messages) => set({ messages }),
}));

export default useConversationStore;
