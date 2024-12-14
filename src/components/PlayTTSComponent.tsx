import React, { useState, useRef } from 'react';

const PlayTTSComponent: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading,] = useState(false);
    const [audioSrc,] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const handleGenerateAudio = async () => {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: "Hello sir" }) // if you use text from state
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const { audioBase64 } = await response.json();

            // Create a blob URL from the base64 data
            const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
            const audio = new Audio(audioUrl);
            await audio.play();

        } catch (error) {
            console.error('Error generating audio:', error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h1>Text-to-Speech (Play.ht)</h1>
            <input
                type="text"
                value={text}
                onChange={handleChange}
                placeholder="Type something..."
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <button onClick={handleGenerateAudio} disabled={isLoading || !text.trim()} style={{ width: '100%', padding: '10px' }}>
                {isLoading ? 'Generating...' : 'Convert to Speech'}
            </button>

            {audioSrc && (
                <div style={{ marginTop: '20px' }}>
                    <audio ref={audioRef} controls />
                </div>
            )}
        </div>
    );
};

export default PlayTTSComponent;
