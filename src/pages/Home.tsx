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
  const accumulatedTextRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (userText: string) => {
    const userMessage: Message = { sender: 'user', text: userText };
    setMessages(prev => [...prev, userMessage]);

    setLoadingTrumpResponse(true);
    accumulatedTextRef.current = '';

    const handleToken = (token: string) => {
      accumulatedTextRef.current += token;
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (!lastMessage || lastMessage.sender !== 'trump') {
          return [...prev, { sender: 'trump', text: token }];
        } else {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: accumulatedTextRef.current,
          };
          return updatedMessages;
        }
      });

      // Check for sentence completion
      if (/[.!?]$/.test(accumulatedTextRef.current)) {
        sendTTSRequest(accumulatedTextRef.current);
        // Optionally reset the accumulated text here if needed
      }
    };

    try {
      await streamGPTResponse(userText, handleToken);
      // After streaming ends, send any remaining text to TTS
      if (!/[.!?]$/.test(accumulatedTextRef.current) && accumulatedTextRef.current.trim()) {
        sendTTSRequest(accumulatedTextRef.current);
      }
    } catch (error) {
      console.error('Error fetching Trump response:', error);
      const errorMessage: Message = { sender: 'trump', text: 'Sorry, something went wrong. Huge problems!' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingTrumpResponse(false);
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
            {isTTSLoading && (
              <div className="waveform-wrapper">
                <Waveform />
              </div>
            )}
          </div>
          <PromptInput onSubmit={handleSend} />
          {isTTSLoading && <p className="tts-status">Reading out the response...</p>}
          {ttsError && <p className="tts-error">{ttsError}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Home;
