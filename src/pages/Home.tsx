// src/pages/Home.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules'; // Import Swiper modules
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ConnectWallet from '../components/ConnectWallet';
import CharacterCard from '../components/CharacterCard';
import PromptInput from '../components/PromptInput';
import { streamGPTResponse } from '../utils/openai';
import { useTTS } from '../hooks/useTTS';
import Waveform from '../components/WaveForm';
import { characters } from '../characters';
import ThemeToggle from '../components/ThemeToggle'; // Import the new ThemeToggle component

interface Message {
  sender: 'user' | 'character';
  text: string;
  status: 'loading' | 'playing' | 'complete';
}

interface HomeProps {
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

const Home: React.FC<HomeProps> = ({ toggleTheme, theme }) => {
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
    <div className="home-container min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="navbar flex justify-between items-center p-4 bg-transparent shadow-md">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Make Crypto Great Again</h1>
        </div>
        <div className="flex items-center">
          {/* Theme Toggle Switch */}
          <ThemeToggle toggleTheme={toggleTheme} theme={theme} />
          <ConnectWallet />
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto flex-1 p-6 space-y-16">
        {/* Character Selection */}
        <section className="px-4 mb-8 mt-8">
          <div className="flex justify-center items-center">
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={4}
              centeredSlides={false} // Disable centered slides for fixed view
              navigation
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
              }}
              loop={true}
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
        <section className="chat-area p-6 rounded-lg shadow-lg flex flex-col h-96 pt-6 mt-4 mb-4">
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
