import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import CharacterCard from '../components/CharacterCard';
import PromptInput from '../components/PromptInput';
import Waveform from '../components/WaveForm';

import { useMessages } from '../hooks/useMessages';
import { useCharacterSelection } from '../hooks/useCharacterSelection';
import { TEST_MODE, FREE_CHARACTER_ID } from '../configs/test.config';
import { charactersConfig } from '../configs/characters.config';
import { thinkingMessages } from '../configs/thinkingMessages.ts';
import useConversationStore from '../stores/useConversationStore';

const Home: React.FC = () => {
  const { connected } = useWallet();
  const {
    messages,
    isPlaying,
    ttsError,
    messagesEndRef,
    handleSend,
    videoBlob,
    clearVideoBlob,
  } = useMessages();

  const {
    selectedCharacter,
    setSelectedCharacter,
    swiperRef,
    selectedIndex,
    getSelectedCharacter,
    characters
  } = useCharacterSelection();

  const setMessages = useConversationStore((state) => state.setMessages);

  const handleClearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderChatArea = () => {
    // In test mode, allow chat if Trump is selected
    const isTrumpSelectedInTestMode =
      TEST_MODE &&
      selectedCharacter === charactersConfig.find(char => char.id === FREE_CHARACTER_ID)?.name;

    if (!connected && !isTrumpSelectedInTestMode) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xl text-gray-400 dark:text-gray-500 mb-4">
            Connect your wallet to start chatting
          </p>
          {TEST_MODE && (
            <p className="text-purple-500">
              Test Mode: Trump is available without connecting
            </p>
          )}
        </div>
      );
    }

    if (!selectedCharacter) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xl text-gray-400 dark:text-gray-500">
            Select a character to start chatting
          </p>
        </div>
      );
    }

    return (
      <>
        {getSelectedCharacter() && (
          <div className="selected-character-icon relative">
            <img
              src={getSelectedCharacter()!.avatar}
              alt={`${getSelectedCharacter()!.name} Avatar`}
              className={`selected-avatar ${isPlaying ? 'speaking' : ''} w-24 h-24`}
            />
            <div className="selected-character-name" style={{ display: 'none' }}>
              {getSelectedCharacter()!.name}
            </div>
            {isPlaying && (
              <div className="waveform-under-avatar absolute inset-0 flex items-center justify-center">
                <Waveform />
                <span className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-green-500 animate-pulse"></span>
              </div>
            )}
          </div>
        )}

        <div className="messages flex-1 overflow-y-auto mb-4 p-2 text-sm max-w-[75%] rounded-lg bg-gray-200">
          {messages.map((m, i) => {
            let messageText = m.text;
            if (m.sender !== 'user' && m.status === 'loading') {
              const characterThinkingMessages = thinkingMessages[selectedCharacter] || [];
              messageText = characterThinkingMessages[Math.floor(Math.random() * characterThinkingMessages.length)] || 'Thinking...';
            }

            const messageClass =
              m.sender === 'user'
                ? 'user-message p-2 text-sm max-w-[75%] rounded-lg bg-blue-200 mb-2'
                : 'character-message p-2 text-sm max-w-[75%] rounded-lg bg-green-200 mb-2';

            return (
              <div key={i} className={messageClass}>
                {m.sender === 'user' ? m.text : messageText}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <PromptInput
          onSubmit={handleSend}
          videoBlob={videoBlob}
          clearVideoBlob={clearVideoBlob}
        />
        {ttsError && <p className="text-red-500 mt-2">{ttsError}</p>}
      </>
    );
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
              breakpoints={{
                0: { slidesPerView: 2 },
                640: { slidesPerView: 4 },
              }}
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
                    {...char}
                    onSelect={() => setSelectedCharacter(char.name)}
                    isSelected={selectedCharacter === char.name}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Chat Area */}
        <section className="chat-area p-6 rounded-lg shadow-lg flex flex-col h-96 pt-6 mt-4 mb-4 relative">
          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="clear-chat-button"
          >
            Clear Chat
          </button>
          {renderChatArea()}
        </section>
      </div>
    </div>
  );
};

export default Home;
