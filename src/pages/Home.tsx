import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import CharacterCard from '../components/CharacterCard';
import PromptInput from '../components/PromptInput';
import { streamGPTResponse } from '../utils/openai';
import { useTTS } from '../hooks/useTTS';
import Waveform from '../components/WaveForm';
import { characters } from '../characters';
import useCharacterStore from '../stores/useCharacterStore';

interface Message {
  sender: 'user' | 'character';
  text: string;
  status: 'loading' | 'playing' | 'complete';
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);
  const setSelectedCharacter = useCharacterStore((state) => state.setSelectedCharacter);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const { isPlaying, error: ttsError, sendTTSRequest } = useTTS();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fullResponseRef = useRef<string>('');
  const swiperRef = useRef<SwiperCore>();

  // Find the index of the selected character
  const selectedIndex = characters.findIndex((char) => char.name === selectedCharacter);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (swiperRef.current && selectedIndex !== -1) {
      swiperRef.current.slideToLoop(selectedIndex, 500);
    }
  }, [selectedCharacter, selectedIndex]);

  const handleSend = async (userText: string) => {
    // Add user message
    const userMessage: Message = { sender: 'user', text: userText, status: 'complete' };
    setMessages(prev => [...prev, userMessage]);

    setLoadingResponse(true);
    fullResponseRef.current = '';

    // Add initial AI message with loading status
    setMessages(prev => [...prev, { sender: 'character', text: '', status: 'loading' }]);

    try {
      // Collect the full response
      await new Promise<void>((resolve, reject) => {
        streamGPTResponse(userText, (token: string) => {
          // Skip empty tokens
          if (!token) return;

          // Add space before token if needed
          const needsSpace = fullResponseRef.current.length > 0 &&
            !fullResponseRef.current.endsWith(' ') &&
            !token.startsWith(' ') &&
            !token.match(/^[.,!?;:)'"%\]}]/) && // Don't add space before punctuation
            !fullResponseRef.current.match(/[({\["'%]$/); // Don't add space after opening brackets/quotes

          fullResponseRef.current += (needsSpace ? ' ' : '') + token;

          // Update the last message with accumulated text
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.sender === 'character') {
              lastMessage.text = fullResponseRef.current;
            }
            return updated;
          });
        })
          .then(() => resolve())
          .catch(reject);
      });

      // Once streaming is complete, update message status and trigger TTS
      if (fullResponseRef.current) {
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage && lastMessage.sender === 'character') {
            lastMessage.status = 'complete';
          }
          return updated;
        });

        // Send the complete response to TTS
        await sendTTSRequest(fullResponseRef.current, () => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.sender === 'character') {
              lastMessage.status = 'playing';
            }
            return updated;
          });
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove loading message
        { sender: 'character', text: 'Oops! Something went wrong.', status: 'complete' }
      ]);
    } finally {
      setLoadingResponse(false);
      fullResponseRef.current = '';
    }
  };

  const getSelectedCharacter = () => {
    return characters.find((char) => char.name === selectedCharacter);
  };

  return (
    <div className="home-container min-h-screen flex flex-col">
      <div className="container mx-auto flex-1 p-6 space-y-16">
        {/* Character Selection */}
        <section className="px-4 mb-8 mt-8">
          <div className="flex justify-center items-center">
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={4}
              centeredSlides={false}
              navigation
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
              }}
              loop={true}
              className="mySwiper"
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                if (selectedIndex !== -1) {
                  swiper.slideToLoop(selectedIndex, 0);
                }
              }}
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
                className={`message ${m.sender} ${m.status} ${m.sender === 'user' ? 'user' : 'character'}`}
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