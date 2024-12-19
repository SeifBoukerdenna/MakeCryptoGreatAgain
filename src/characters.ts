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
    name: "Donald Trump 2",
    avatar: TrumpAvatar,
    description: "Make chats great again!",
  },
  {
    id: "3",
    name: "Donald Trump 3",
    avatar: TrumpAvatar,
    description: "Make chats great again!",
  },
  {
    id: "4",
    name: "Donald Trump 4",
    avatar: TrumpAvatar,
    description: "Make chats great again!",
  },
  {
    id: "5",
    name: "Elon Musk",
    avatar: MuskAvatar,
    description: "Let’s innovate together.",
  },
  {
    id: "6",
    name: "Andrew Tate",
    avatar: TateAvatar,
    description: "Top G is ready.",
  },
  {
    id: "7",
    name: "Satoshi Nakamoto",
    avatar: "path/to/avatar7.png",
    description: "Creator of Bitcoin.",
  },
  {
    id: "8",
    name: "Ada Lovelace",
    avatar: "path/to/avatar8.png",
    description: "Pioneer of Computing.",
  },
  {
    id: "9",
    name: "Alan Turing",
    avatar: "path/to/avatar9.png",
    description: "Father of AI.",
  },
  {
    id: "10",
    name: "Grace Hopper",
    avatar: "path/to/avatar10.png",
    description: "Queen of Code.",
  },
  // Add more characters as needed
];
