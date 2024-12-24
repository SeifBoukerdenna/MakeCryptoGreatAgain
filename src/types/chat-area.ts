// src/types/chat-area.ts

import { Message } from "../stores/useConversationStore";
import { CharacterConfig } from "../configs/characters.config";

export interface ChatAreaProps {
  messages: Message[];
  loadingResponse: boolean;
  isPlaying: boolean;
  ttsError: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleSend: (text: string) => void;
  selectedCharacter: string | null;
  getSelectedCharacter: () => CharacterConfig | null;
}
