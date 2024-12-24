import React from 'react';
import PromptInput from './PromptInput';
import VideoRecorder from './VideoRecorder';
import Waveform from './WaveForm';
import { ChatAreaProps } from '../types/chat-area';

export const ChatArea: React.FC<ChatAreaProps> = ({
    messages,
    loadingResponse,
    isPlaying,
    ttsError,
    audioRef,
    messagesEndRef,
    handleSend,
    selectedCharacter,
    getSelectedCharacter
}) => {
    const character = getSelectedCharacter();

    if (!character || !selectedCharacter) {
        return null;
    }

    return (
        <div className="chat-area p-6 rounded-lg shadow-lg flex flex-col h-96 pt-6 mt-4 mb-4">
            <div className="selected-character-icon">
                <img
                    src={character.avatar}
                    alt={`${character.name} Avatar`}
                    className={`selected-avatar ${isPlaying ? 'speaking' : ''}`}
                />
                {isPlaying && (
                    <div className="waveform-under-avatar">
                        <Waveform />
                    </div>
                )}
            </div>

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

            <div className="relative">
                <PromptInput
                    onSubmit={handleSend}
                    isPlaying={isPlaying}
                    audioRef={audioRef}
                />
                <VideoRecorder
                    isPlaying={isPlaying}
                    audioRef={audioRef}
                />
            </div>

            {ttsError && <p className="text-red-500 mt-2">{ttsError}</p>}
            {loadingResponse && <p className="text-gray-400 mt-2">Loading response...</p>}

            <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
    );
};

export default ChatArea;