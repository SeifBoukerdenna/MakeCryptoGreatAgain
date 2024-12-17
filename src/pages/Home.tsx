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
  status: 'loading' | 'playing' | 'complete';
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingTrumpResponse, setLoadingTrumpResponse] = useState(false);
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

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence) {
        sentencesQueue.current.push(trimmedSentence);
      }
    });

    return text.replace(sentences.join(''), '').trim();
  };

  const processQueue = async () => {
    while (sentencesQueue.current.length > 0) {
      const sentence = sentencesQueue.current.shift();
      if (sentence) {
        console.log("Sending TTS request with sentence:", sentence);
        await sendTTSRequest(sentence, () => {
          // Update message status to playing when audio starts
          setMessages(prev => {
            const lastIndex = prev.length - 1;
            if (lastIndex >= 0 && prev[lastIndex].sender === 'trump') {
              const updatedMessages = [...prev];
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                status: 'playing'
              };
              return updatedMessages;
            }
            return prev;
          });
        });
      }
    }
  };

  const handleSend = async (userText: string) => {
    const userMessage: Message = { sender: 'user', text: userText, status: 'complete' };
    setMessages(prev => [...prev, userMessage]);

    setLoadingTrumpResponse(true);
    fullResponseRef.current = '';
    responseBuffer.current = '';
    sentencesQueue.current = [];

    const handleToken = (token: string) => {
      const spaceIfNeeded = fullResponseRef.current && !fullResponseRef.current.endsWith(' ') ? ' ' : '';
      fullResponseRef.current += spaceIfNeeded + token;
      responseBuffer.current += spaceIfNeeded + token;

      // Update or create trump message with loading status
      setMessages(prev => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];

        if (!lastMessage || lastMessage.sender !== 'trump') {
          return [...prev, {
            sender: 'trump',
            text: fullResponseRef.current.trim(),
            status: 'loading'
          }];
        } else {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: fullResponseRef.current.trim()
          };
          return updatedMessages;
        }
      });

      const remainingText = processSentences(responseBuffer.current);
      responseBuffer.current = remainingText || '';

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
      console.error("Error fetching Trump response:", error);
      const errorMessage: Message = {
        sender: 'trump',
        text: "Sorry, something went wrong. Huge problems!",
        status: 'complete'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingTrumpResponse(false);
      responseBuffer.current = '';
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
              <div key={i} className={`message ${m.sender} ${m.status}`}>
                {m.status === 'loading' ? (
                  <p>Preparing response...</p>
                ) : (
                  <p>{m.text}</p>
                )}
              </div>
            ))}
            {loadingTrumpResponse && (
              <div className="message trump loading">
                <p>Thinking... (in a very big way!)</p>
              </div>
            )}
          </div>
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