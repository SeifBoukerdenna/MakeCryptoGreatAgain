import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules'; // Import Swiper modules
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import TrumpAvatar from '../assets/trump-memoji.jpg';
import MuskAvatar from '../assets/musk-memoji.png';
import TateAvatar from '../assets/tate-memoji.png';
import ConnectWallet from '../components/ConnectWallet';
import CharacterCard from '../components/CharacterCard';
import PromptInput from '../components/PromptInput';
import { streamGPTResponse } from '../utils/openai';
import { useTTS } from '../hooks/useTTS';
import Waveform from '../components/WaveForm';

interface Message {
  sender: 'user' | 'character';
  text: string;
  status: 'loading' | 'playing' | 'complete';
}

interface Character {
  id: string; // Unique identifier
  name: string;
  avatar: string;
  description: string;
}

const characters: Character[] = [
  { id: '1', name: 'Donald Trump', avatar: TrumpAvatar, description: 'Make chats great again!' },
  { id: '2', name: 'Donald Trump 2', avatar: TrumpAvatar, description: 'Make chats great again!' },
  { id: '3', name: 'Donald Trump 3', avatar: TrumpAvatar, description: 'Make chats great again!' },
  { id: '4', name: 'Donald Trump 4', avatar: TrumpAvatar, description: 'Make chats great again!' },
  { id: '5', name: 'Elon Musk', avatar: MuskAvatar, description: 'Let’s innovate together.' },
  { id: '6', name: 'Andrew Tate', avatar: TateAvatar, description: 'Top G is ready.' },
  { id: '7', name: 'Satoshi Nakamoto', avatar: 'path/to/avatar7.png', description: 'Creator of Bitcoin.' },
  { id: '8', name: 'Ada Lovelace', avatar: 'path/to/avatar8.png', description: 'Pioneer of Computing.' },
  { id: '9', name: 'Alan Turing', avatar: 'path/to/avatar9.png', description: 'Father of AI.' },
  { id: '10', name: 'Grace Hopper', avatar: 'path/to/avatar10.png', description: 'Queen of Code.' },
  // Add more characters as needed
];

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>(characters[0].name);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const { isPlaying, error: ttsError, sendTTSRequest } = useTTS();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fullResponseRef = useRef<string>('');
  const responseBuffer = useRef<string>('');
  const sentencesQueue = useRef<string[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processSentences = (text: string) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    sentencesQueue.current.push(...sentences.map((s) => s.trim()));
    return text.replace(sentences.join(''), '').trim();
  };

  const processQueue = async () => {
    while (sentencesQueue.current.length > 0) {
      const sentence = sentencesQueue.current.shift();
      if (sentence) {
        await sendTTSRequest(sentence, () => {
          setMessages((prev) => {
            const lastIndex = prev.length - 1;
            const updated = [...prev];
            if (updated[lastIndex]?.sender === 'character') {
              updated[lastIndex].status = 'playing';
            }
            return updated;
          });
        });
      }
    }
  };

  const handleSend = async (userText: string) => {
    const userMessage: Message = { sender: 'user', text: userText, status: 'complete' };
    setMessages((prev) => [...prev, userMessage]);

    setLoadingResponse(true);
    fullResponseRef.current = '';
    responseBuffer.current = '';
    sentencesQueue.current = [];

    const handleToken = (token: string) => {
      fullResponseRef.current += token;
      responseBuffer.current += token;

      setMessages((prev) => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];

        if (!lastMessage || lastMessage.sender !== 'character') {
          updated.push({ sender: 'character', text: fullResponseRef.current, status: 'loading' });
        } else {
          updated[updated.length - 1].text = fullResponseRef.current;
        }
        return updated;
      });

      const remaining = processSentences(responseBuffer.current);
      responseBuffer.current = remaining || '';

      if (sentencesQueue.current.length > 0) {
        processQueue();
      }
    };

    try {
      await streamGPTResponse(userText, handleToken);

      if (responseBuffer.current.trim()) {
        sentencesQueue.current.push(responseBuffer.current.trim());
        processQueue();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'character', text: 'Oops! Something went wrong.', status: 'complete' },
      ]);
    } finally {
      setLoadingResponse(false);
      responseBuffer.current = '';
    }
  };

  const getSelectedCharacter = () => {
    return characters.find((char) => char.name === selectedCharacter);
  };

  return (
    <div className="home-container bg-gradient-to-r from-gray-800 via-gray-900 to-black text-gray-100 min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="navbar flex justify-between items-center p-4 bg-transparent shadow-md">
        <h1 className="text-2xl font-bold">Make Crypto Great Again</h1>
        <ConnectWallet />
      </nav>

      {/* Main Content */}
      <div className="container mx-auto flex-1 p-6 space-y-16"> {/* Added space-y-16 for spacing between sections */}
        {/* Character Selection */}
        <section className="px-4"> {/* Removed mb-12 as space-y handles spacing */}
          <h2 className="text-center text-3xl font-bold mb-4">Choose Your Character</h2>
          <div className="flex justify-center items-center"> {/* Ensured flex items are centered vertically */}
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={15}
              slidesPerView={3}
              centeredSlides={true} // Centered slides
              navigation
              pagination={{ clickable: true }}
              loop={true}
              breakpoints={{
                320: {
                  slidesPerView: 1.2,
                  spaceBetween: 10,
                },
                640: {
                  slidesPerView: 2.2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3.2,
                  spaceBetween: 30,
                },
              }}
              className="mySwiper"
            >
              {characters.map((char) => (
                <SwiperSlide key={char.id}>
                  <CharacterCard
                    id={char.id}
                    name={char.name}
                    avatar={char.avatar}
                    description={char.description}
                    onSelect={() => setSelectedCharacter(char.name)}
                    isSelected={selectedCharacter === char.name}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Chat Area */}
        <section className="chat-area bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-96">
          {/* Selected Character Icon */}
          {getSelectedCharacter() && (
            <div className="selected-character-icon flex justify-center mb-4">
              <img
                src={getSelectedCharacter()!.avatar}
                alt={`${getSelectedCharacter()!.name} Avatar`}
                className="selected-avatar"
              />
            </div>
          )}

          <div className="messages flex-1 overflow-y-auto mb-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message ${m.sender} ${m.status} ${m.sender === 'user' ? 'user' : 'character'
                  }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <PromptInput onSubmit={handleSend} />
          {isPlaying && <Waveform />}
          {ttsError && <p className="text-red-500 mt-2">{ttsError}</p>}
          {loadingResponse && <p className="text-gray-400 mt-2">Loading response...</p>}
        </section>
      </div>
    </div>
  );
};

export default Home;
