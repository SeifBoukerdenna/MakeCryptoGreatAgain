import TrumpAvatar from "./assets/trump-memoji.jpg";
import MuskAvatar from "./assets/musk-memoji.png";
import TateAvatar from "./assets/tate-memoji.png";

interface Character {
  id: string; // Unique identifier
  name: string;
  avatar: string;
  description: string;
}

export const characters: Character[] = [
  {
    id: "1",
    name: "Donald Trump",
    avatar: TrumpAvatar,
    description: "Make chats great again!",
  },
  {
    id: "2",
    name: "Elon Musk",
    avatar: MuskAvatar,
    description: "Let’s innovate together.",
  },
  {
    id: "3",
    name: "Andrew Tate",
    avatar: TateAvatar,
    description: "Top G is ready.",
  },
  // Add more characters as needed
];
