// src/components/PlayTTSComponent.tsx

import React, { useState } from 'react';
import { useTTS } from '../hooks/useTTS';


const PlayTTSComponent: React.FC = () => {
    const [text, setText] = useState('');
    const { isLoading, error, generateAudio } = useTTS();

    const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const handleGenerateAudio = async () => {
        await generateAudio(text);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h1>Text-to-Speech (Play.ht)</h1>
            <input
                type="text"
                value={text}
                onChange={handleChangeText}
                placeholder="Type something..."
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <button
                onClick={handleGenerateAudio}
                disabled={isLoading || !text.trim()}
                style={{ width: '100%', padding: '10px' }}
            >
                {isLoading ? 'Generating...' : 'Convert to Speech'}
            </button>

            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        </div>
    );
};

export default PlayTTSComponent;
