// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import TrumpAvatar from '../components/TrumpAvatar';
import ConnectWallet from '../components/ConnectWallet';
import BuyTrumpTalkCoin from '../components/BuyTrumpTalkCoin';
import PromptInput from '../components/PromptInput';
import { streamTrumpResponseFromOpenAI } from '../utils/openai';
import { useTTS } from '../hooks/useTTS';

interface Message {
    sender: 'user' | 'trump';
    text: string;
}

const AUTH_TOKEN = "YOUR_PLAYHT_API_KEY";
const USER_ID = "YOUR_PLAYHT_USER_ID";
const DEFAULT_VOICE = "s3://voice..."; // your chosen voice

const Home: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingTrumpResponse, setLoadingTrumpResponse] = useState(false);

    // Using the new useTTS hook
    const { isLoading: isTTSLoading, error: ttsError, sendTTSRequest } = useTTS(AUTH_TOKEN, USER_ID, DEFAULT_VOICE);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const accumulatedTextRef = useRef<string>("");

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (userText: string) => {
        // Add user message
        const userMessage: Message = { sender: 'user', text: userText };
        setMessages(prev => [...prev, userMessage]);

        setLoadingTrumpResponse(true);
        accumulatedTextRef.current = ""; // Reset accumulated text for this response

        const handleToken = (token: string) => {
            accumulatedTextRef.current += token;
            setMessages((prev) => {
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

            // Check if we ended a sentence
            if (
                accumulatedTextRef.current.endsWith('.') ||
                accumulatedTextRef.current.endsWith('!') ||
                accumulatedTextRef.current.endsWith('?')
            ) {
                // We have a full sentence, send it to TTS now
                console.log("Sending TTS request with sentence:", accumulatedTextRef.current);
                sendTTSRequest(accumulatedTextRef.current);

                // Reset the accumulation to start fresh for the next sentence
                // accumulatedTextRef.current = "";
            }
        };

        try {
            await streamTrumpResponseFromOpenAI(userText, handleToken);
            // After finalizing, if we never hit a period, just send whatever we have
            if (!accumulatedTextRef.current.match(/[.!?]$/)) {
                console.log("Sending TTS request with text:", accumulatedTextRef.current);
                sendTTSRequest(accumulatedTextRef.current);
            }

        } catch (error) {
            console.error("Error fetching Trump response:", error);
            const errorMessage: Message = { sender: 'trump', text: "Sorry, something went wrong. Huge problems!" };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoadingTrumpResponse(false);
        }
    };

    return (
        <div className="home-container">
            <nav className="nav-bar">
                <div className="logo">TrumpTalk</div>
                <div className="nav-right">
                    <ConnectWallet />
                </div>
            </nav>

            <header className="header">
                <h1 className="title">Talk With "Trump"</h1>
                <p className="subtitle">The Ultimate American Crypto Chat</p>
            </header>

            <div className="main-content">
                <div className="sidebar">
                    <BuyTrumpTalkCoin />
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
                        <div ref={messagesEndRef} />
                    </div>
                    <PromptInput onSubmit={handleSend} />
                    {isTTSLoading && <p className="tts-status">Reading out the response...</p>}
                    {ttsError && <p className="tts-error">{ttsError}</p>}
                </div>
            </div>
        </div>
    );
};

export default Home;
