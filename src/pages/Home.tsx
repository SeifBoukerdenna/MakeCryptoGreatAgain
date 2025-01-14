// import { useWallet } from '@solana/wallet-adapter-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import CharacterCard from '../components/CharacterCard';
import PromptInput from '../components/PromptInput';
// import Waveform from '../components/WaveForm';
import { useMessages } from '../hooks/useMessages';
import { useCharacterSelection } from '../hooks/useCharacterSelection';
import { thinkingMessages } from '../configs/thinkingMessages.ts';
import useConversationStore from '../stores/useConversationStore';
import GuidedTour from '../components/tours/GuidedTour.tsx';
import QueueStatus from '../components/QueueStatus.tsx';

const Home = () => {
  // const { connected } = useWallet();
  const {
    messages,
    isPlaying,
    ttsError,
    messagesEndRef,
    handleSend,
    videoBlob,
    clearVideoBlob,
    loadingResponse,
    queuePosition,
    activeRequests,
    isProcessing: queueProcessing,
    getTimeUntilNextSlot,
  } = useMessages();

  const isProcessing = loadingResponse || isPlaying;

  const {
    selectedCharacter,
    setSelectedCharacter,
    swiperRef,
    selectedIndex,
    getSelectedCharacter,
    characters
  } = useCharacterSelection();

  const setMessages = useConversationStore((state) => state.setMessages);
  const handleClearChat = () => setMessages([]);

  const renderChatArea = () => {
    if (!selectedCharacter) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center my-8">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome! Pick a character to start chatting
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            Have conversations with famous personalities, win tokens, and be part of history
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {getSelectedCharacter() && (
          <div className="selected-character-icon relative flex flex-col items-center">
            <img
              src={getSelectedCharacter()!.avatar}
              alt={`${getSelectedCharacter()!.name} Avatar`}
              className={`selected-avatar ${isPlaying ? 'speaking' : ''} w-24 h-24 transition-transform hover:scale-105`}
            />
            <div className="selected-character-name text-transparent hidden">
              {getSelectedCharacter()!.name}
            </div>
            {isPlaying && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                {/* <Waveform /> */}
              </div>
            )}
          </div>
        )}

        <div className="messages flex-1 overflow-y-auto mb-4 p-4 text-base rounded-lg bg-opacity-50 backdrop-blur-sm max-h-96 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              Start the conversation by typing a message below
            </div>
          )}
          {messages.map((m, i) => {
            let messageText = m.text;
            if (m.sender !== 'user' && m.status === 'loading') {
              const characterThinkingMessages = thinkingMessages[selectedCharacter] || [];
              messageText = characterThinkingMessages[Math.floor(Math.random() * characterThinkingMessages.length)] || 'Thinking...';
            }

            return (
              <div
                key={i}
                className={`message p-3 rounded-lg max-w-[80%] ${m.sender === 'user'
                  ? 'ml-auto bg-purple-100 dark:bg-purple-900'
                  : 'bg-gray-100 dark:bg-gray-800'
                  } shadow-sm animate-fadeIn`}
              >
                {messageText}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <PromptInput
          onSubmit={handleSend}
          videoBlob={videoBlob}
          clearVideoBlob={clearVideoBlob}
          isProcessing={isProcessing}
        />
        {ttsError && (
          <p className="text-red-500 text-sm text-center">{ttsError}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <GuidedTour />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <section className="character-slider-section">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            breakpoints={{
              0: { slidesPerView: 1.2 },
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 }
            }}
            centeredSlides={true}
            navigation
            pagination={{ clickable: true }}
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
                  canSelect={!isProcessing}
                  onSelect={() => {
                    if (isPlaying) return;
                    setSelectedCharacter(char.name);
                    handleClearChat();
                  }}
                  isSelected={selectedCharacter === char.name}
                  overrideWalletCheck={char.name === 'Donald Trump'}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        <section className="chat-area p-6 rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900">
          {renderChatArea()}
        </section>

        <QueueStatus
          queuePosition={queuePosition}
          activeRequests={activeRequests}
          isProcessing={queueProcessing}
          getTimeUntilNextSlot={getTimeUntilNextSlot}
        />
      </div>
    </div>
  );
};

export default Home;