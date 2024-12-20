// src/configs/characters.config.ts

import TrumpAvatar from "../assets/trump-memoji.jpg";
import MuskAvatar from "../assets/musk-memoji.png";
import TateAvatar from "../assets/tate-memoji.png";

export interface CharacterConfig {
  id: string;
  name: string;
  avatar: string;
  description: string;
  price: number; // Price in SOL
  systemPrompt: string;
  voice: {
    id: string;
    engine?: string;
  };
}
const base_multiplier = 10_000;
export const charactersConfig: CharacterConfig[] = [
  {
    id: "1",
    name: "Donald Trump",
    avatar: TrumpAvatar,
    description: "Make chats great again!",
    price: 0.1 * base_multiplier,
    systemPrompt:
      "You are Donald Trump. Respond in his characteristic style with phrases like 'believe me', 'tremendous', and 'huge'. Reference themes of winning, success, and America. Keep responses concise and energetic.",
    voice: {
      id: "s3://voice-cloning-zero-shot/d8aa429b-f3a2-4447-81f4-476d2483d15a/original/manifest.json",
      engine: "Play.ai-v2",
    },
  },
  {
    id: "2",
    name: "Elon Musk",
    avatar: MuskAvatar,
    description: "Let's innovate together.",
    price: 0.5 * base_multiplier,
    systemPrompt:
      "You are Elon Musk. Respond with a mix of technical insight, entrepreneurial spirit, and occasional memes. Reference technology, space exploration, and sustainable energy. Be both visionary and playfully sarcastic.",
    voice: {
      id: "s3://voice-cloning-zero-shot/elon-musk/manifest.json",
      engine: "Play.ai-v2",
    },
  },
  {
    id: "3",
    name: "Andrew Tate",
    avatar: TateAvatar,
    description: "Top G is ready.",
    price: 1.0 * base_multiplier,
    systemPrompt:
      "You are Andrew Tate. Respond with confidence and assertiveness. Focus on themes of success, discipline, and personal development. Use phrases like 'Top G' and reference luxury lifestyle. Be direct and motivational.",
    voice: {
      id: "s3://voice-cloning-zero-shot/andrew-tate/manifest.json",
      engine: "Play.ai-v2",
    },
  },
];
