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
import Waveform from '../components/WaveForm.tsx';

const Home = () => {
  // const { connected } = useWallet();
  const {
    messages,
    isPlaying,
    // ttsError,
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
        <div className="flex flex-col items-center justify-center h-full text-center my-8">
          <p className="text-xl text-gray-400 dark:text-gray-500 font-bold">
            Select a character to start chatting
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 relative"> {/* Added relative positioning */}
        {messages.length > 0 && (
          <button onClick={handleClearChat} className="clear-chat-button">
            Clear Chat
          </button>
        )}

        {getSelectedCharacter() && (
          <div className="selected-character-icon relative">
            <img
              src={getSelectedCharacter()!.avatar}
              alt={`${getSelectedCharacter()!.name} Avatar`}
              className={`selected-avatar ${isPlaying ? 'speaking' : ''} w-24 h-24`}
            />
            <div className="selected-character-name">
              {getSelectedCharacter()!.name}
            </div>
            {isPlaying && (
              <div className="waveform-under-avatar absolute inset-0 flex items-center justify-center">
                <Waveform />
              </div>
            )}
          </div>
        )}

        <div className="messages flex-1 overflow-y-auto mb-4 p-4 text-base rounded-lg bg-opacity-50 backdrop-blur-sm max-h-96 space-y-3">
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