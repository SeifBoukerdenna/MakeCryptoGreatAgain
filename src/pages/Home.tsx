import React, { useState } from 'react';
import TrumpAvatar from '../components/TrumpAvatar';
import MessageInput from '../components/MessageInput';
import ConnectWallet from '../components/ConnectWallet';
import BuyTrumpTalkCoin from '../components/BuyTrumpTalkCoin';
import { getTrumpResponseFromOpenAI } from '../utils/openai';

interface Message {
    sender: 'user' | 'trump';
    text: string;
}

const Home: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [loadingTrumpResponse, setLoadingTrumpResponse] = useState(false);

    const handleSend = async (userText: string) => {
        const userMessage: Message = { sender: 'user', text: userText };
        setMessages(prev => [...prev, userMessage]);
        setLoadingTrumpResponse(true);

        try {
            const trumpReplyText = await getTrumpResponseFromOpenAI(userText);
            const trumpReply: Message = { sender: 'trump', text: trumpReplyText.trim() };
            setMessages(prev => [...prev, trumpReply]);
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
                    </div>
                    <MessageInput onSend={handleSend} />
                </div>
            </div>
        </div>
    );
};

export default Home;
