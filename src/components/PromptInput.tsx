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
        <div className="flex w-full">
            <input
                type="text"
                placeholder="Ask your question..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 p-2 pl-8 bg-[#2c2f36] text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-blue-600"
                style={{
                    backgroundImage: 'url(/src/assets/mini-eagle-coin.png)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left center',
                    backgroundSize: '20px',
                }}
            />
            <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="ml-2 bg-gradient-to-r from-red-600 to-blue-600 text-white px-4 py-2 rounded-full font-bold cursor-pointer disabled:opacity-50 transition-opacity"
            >
                Submit
            </button>
        </div>
    );
};

export default PromptInput;
