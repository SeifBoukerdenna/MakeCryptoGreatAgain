// src/components/PromptInput.tsx

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
        <div className="prompt-input">
            <input
                type="text"
                placeholder="Ask your question..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="input-field"
            />
            <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="submit-button"
            >
                Submit
            </button>
        </div>
    );
};

export default PromptInput;
