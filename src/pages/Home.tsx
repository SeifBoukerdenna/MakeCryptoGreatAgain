// /src/pages/Home.tsx

import React, { useState, useEffect, useRef } from 'react';
import TrumpAvatar from '../components/TrumpAvatar';
import ConnectWallet from '../components/ConnectWallet';
import { streamGPTResponse } from '../utils/openai';
import { useTTS } from '../hooks/useTTS';
import MuskAvatar from '../components/MuskAvatar';
import TateAvatar from '../components/TateAvatar';
import PromptInput from '../components/PromptInput';
import Waveform from '../components/WaveForm';

interface Message {
  sender: 'user' | 'trump';
  text: string;
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingTrumpResponse, setLoadingTrumpResponse] = useState(false);
  const { isLoading: isTTSLoading, isPlaying, error: ttsError, sendTTSRequest } = useTTS();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fullResponseRef = useRef<string>('');
  const currentSentenceRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processSentence = (text: string) => {
    if (text.trim()) {
      console.log("Sending TTS request with sentence:", text.trim());
      sendTTSRequest(text.trim());
    }
  };

  const handleSend = async (userText: string) => {
    // Add user message
    const userMessage: Message = { sender: 'user', text: userText };
    setMessages(prev => [...prev, userMessage]);

    setLoadingTrumpResponse(true);
    fullResponseRef.current = '';
    currentSentenceRef.current = '';

    const handleToken = (token: string) => {
      // Add proper spacing between tokens
      const spaceIfNeeded = currentSentenceRef.current && !currentSentenceRef.current.endsWith(' ') ? ' ' : '';
      currentSentenceRef.current += spaceIfNeeded + token;
      fullResponseRef.current += spaceIfNeeded + token;

      // Update the message with the full accumulated response
      setMessages(prev => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];

        if (!lastMessage || lastMessage.sender !== 'trump') {
          return [...prev, { sender: 'trump', text: fullResponseRef.current.trim() }];
        } else {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: fullResponseRef.current.trim()
          };
          return updatedMessages;
        }
      });

      // Check for sentence endings and process for TTS
      if (token.match(/[.!?]\s*$/)) {
        processSentence(currentSentenceRef.current);
        currentSentenceRef.current = '';
      }
    };

    try {
      await streamGPTResponse(userText, handleToken);

      // Handle any remaining text that didn't end with punctuation
      if (currentSentenceRef.current.trim()) {
        processSentence(currentSentenceRef.current);
      }
    } catch (error) {
      console.error("Error fetching Trump response:", error);
      const errorMessage: Message = { sender: 'trump', text: "Sorry, something went wrong. Huge problems!" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingTrumpResponse(false);
      currentSentenceRef.current = '';
    }
  };

  return (
    <div className="home-container">
      <ConnectWallet />
      <div className="main-content">
        <div className="character-carousel">
          <MuskAvatar />
          <TateAvatar />
        </div>
        <div className="chat-area">
          <div className="chat-header">
            <TrumpAvatar />
          </div>
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.sender}`}>
                <p>{m.text}</p>
              </div>
            ))}
            {loadingTrumpResponse && (
              <div className="message trump loading">
                <p>Thinking... (in a very big way!)</p>
              </div>
            )}
          </div>
          {/* Only show waveform when audio is actually playing */}
          {isPlaying && (
            <div className="waveform-wrapper">
              <Waveform />
            </div>
          )}
          <PromptInput onSubmit={handleSend} />
          {ttsError && <p className="tts-error">{ttsError}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Home;