import React, { useState } from 'react';

interface MessageInputProps {
    onSend: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSendClick = () => {
        if (inputValue.trim()) {
            onSend(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSendClick();
    };

    return (
        <div className="message-input-container">
            <input
                type="text"
                placeholder="Ask something huge..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="message-input"
            />
            <button onClick={handleSendClick} className="send-button">Send</button>
        </div>
    );
};

export default MessageInput;
