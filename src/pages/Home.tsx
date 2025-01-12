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
import { thinkingMessages } from '../configs/thinkingMessages.ts';
import useConversationStore from '../stores/useConversationStore';
import GuidedTour from '../components/tours/GuidedTour.tsx';
import QueueStatus from '../components/QueueStatus.tsx';
import LaunchCountdownOverlay from '../components/LaunchCountdownOverlay';

const Home = () => {
  const { connected } = useWallet();
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
    isProcessing: isProcessingQueue,
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

  const isTrumpSelected = selectedCharacter === 'Donald Trump';

  const renderChatArea = () => {
    // Allow chat if Trump is selected, regardless of wallet connection
    if (!selectedCharacter) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center my-8">
          <p className="text-xl text-gray-400 dark:text-gray-500 font-bold">
            Select a character to start chatting
          </p>
        </div>
      );
    }

    // Only require wallet connection for non-Trump characters
    if (!connected && !isTrumpSelected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xl text-gray-400 dark:text-gray-500 mb-4">
            Connect your wallet to chat with other characters
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

        <div
          className="messages flex-1 overflow-y-auto mb-4 p-2 text-sm max-w-[75%] rounded-lg bg-gray-200 max-h-80"
          style={{ maxHeight: '20rem' }}
        >
          {messages.map((m, i) => {
            let messageText = m.text;
            if (m.sender !== 'user' && m.status === 'loading') {
              const characterThinkingMessages = thinkingMessages[selectedCharacter] || [];
              messageText =
                characterThinkingMessages[
                Math.floor(Math.random() * characterThinkingMessages.length)
                ] || 'Thinking...';
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

        <PromptInput onSubmit={handleSend} videoBlob={videoBlob} clearVideoBlob={clearVideoBlob} isProcessing={isProcessing} />
        {ttsError && <p className="text-red-500 mt-2">{ttsError}</p>}
      </>
    );
  };

  return (
    <>
      <GuidedTour />
      <LaunchCountdownOverlay />
      <div className="home-container min-h-screen flex flex-col">
        <div className="container mx-auto flex-1 p-6 space-y-16">
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
            </div>
          </section>

          <script type="text/javascript">
            {/* Insert Twitter Event ID */}
          </script>

          <section className="chat-area p-6 rounded-lg shadow-lg flex flex-col h-96 pt-6 mt-4 mb-4 relative">
            <button onClick={handleClearChat} className="clear-chat-button">
              Clear Chat
            </button>
            {renderChatArea()}
          </section>
          <QueueStatus
            queuePosition={queuePosition}
            activeRequests={activeRequests}
            isProcessing={isProcessingQueue}
            getTimeUntilNextSlot={getTimeUntilNextSlot}
          />
        </div>
      </div>

      <script type="text/javascript">
        {/* Insert Twitter Event ID */}
        twq('event', 'tw-oys58-oyxym', { });
      </script>
    </>
  );
};

export default Home;