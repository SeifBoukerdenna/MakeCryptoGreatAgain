// src/pages/Home.tsx

import React, { useState, useEffect, useRef } from 'react';
import TrumpAvatar from '../components/TrumpAvatar';
import ConnectWallet from '../components/ConnectWallet';
import BuyTrumpTalkCoin from '../components/BuyTrumpTalkCoin';
import PromptInput from '../components/PromptInput';
import { getTrumpResponseFromOpenAI } from '../utils/openai';
import { useTTS } from '../hooks/useTTS';
// import './Home.css'; // Ensure you have appropriate styling

interface Message {
    sender: 'user' | 'trump';
    text: string;
}

const Home: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [loadingTrumpResponse, setLoadingTrumpResponse] = useState(false);
    const { isLoading: isTTSLoading, error: ttsError, generateAudio } = useTTS();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (userText: string) => {
        const userMessage: Message = { sender: 'user', text: userText };
        setMessages(prev => [...prev, userMessage]);
        setLoadingTrumpResponse(true);

        try {
            const trumpReplyText = await getTrumpResponseFromOpenAI(userText);
            const trumpReply: Message = { sender: 'trump', text: trumpReplyText.trim() };
            setMessages(prev => [...prev, trumpReply]);

            await generateAudio(trumpReply.text);
        } catch (error) {
            console.error("Error fetching Trump response:", error);
            const errorMessage: Message = { sender: 'trump', text: "Sorry, something went wrong. Huge problems!" };
            setMessages(prev => [...prev, errorMessage]);

            // await generateAudio(errorMessage.text);
        } finally {
            setLoadingTrumpResponse(false);
        }
    };

    return (
        <div className="home-container">
            <nav className="nav-bar">
                <div className="logo">TrumpTalk</div>
                <div className="nav-right">
                    <ConnectWallet walletAddress={walletAddress} setWalletAddress={setWalletAddress} />
                </div>
            </nav>

            <header className="header">
                <h1 className="title">Talk With "Trump"</h1>
                <p className="subtitle">The Ultimate American Crypto Chat</p>
            </header>

            <div className="main-content">
                <div className="sidebar">
                    <BuyTrumpTalkCoin walletAddress={walletAddress} />
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
