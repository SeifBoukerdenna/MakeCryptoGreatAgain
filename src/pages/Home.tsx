// src/pages/Home.tsx

import React, { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import CharacterCard from '../components/CharacterCard';
import PromptInput from '../components/PromptInput';
import Waveform from '../components/WaveForm';
import { useMessages } from '../hooks/useMessages';
import { useCharacterSelection } from '../hooks/useCharacterSelection';

const Home: React.FC = () => {
  const {
    messages,
    loadingResponse,
    isPlaying,
    ttsError,
    messagesEndRef,
    handleSend
  } = useMessages();

  const {
    selectedCharacter,
    setSelectedCharacter,
    swiperRef,
    selectedIndex,
    getSelectedCharacter,
    characters
  } = useCharacterSelection();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            <div className="selected-character-icon">
              <img
                src={getSelectedCharacter()!.avatar}
                alt={`${getSelectedCharacter()!.name} Avatar`}
                className={`selected-avatar ${isPlaying ? 'speaking' : ''}`}
              />
              {isPlaying && (
                <div className="waveform-under-avatar">
                  <Waveform />
                </div>
              )}
            </div>
          )}

          <div className="messages flex-1 overflow-y-auto mb-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message ${m.sender} ${m.status} ${m.sender === 'user' ? 'user' : 'character'
                  }`}
              >
                {m.sender === 'user' ? m.text : m.status === 'loading' ? 'Thinking...' : m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <PromptInput onSubmit={handleSend} />
          {ttsError && <p className="text-red-500 mt-2">{ttsError}</p>}
          {loadingResponse && <p className="text-gray-400 mt-2">Loading response...</p>}
        </section>
      </div>
    </div>
  );
};

export default Home;