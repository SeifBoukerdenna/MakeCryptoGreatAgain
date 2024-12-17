// /src/components/PromptInput.tsx

import React, { useState } from 'react';

interface PromptInputProps {
    onSubmit: (prompt: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit }) => {
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
        }
    };

    return (
        <div className="message-input-container flex items-center">
            <input
                type="text"
                placeholder="Ask your question..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="message-input placeholder-gray-400"
            />
            <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="send-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Send
            </button>
        </div>
    );
};

export default PromptInput;
