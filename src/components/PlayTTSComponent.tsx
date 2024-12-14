import React, { useState, useRef } from 'react';

const PlayTTSComponent: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [audioSrc, setAudioSrc] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null);

    const userId = import.meta.env.VITE_Play_UserId;
    const secretKey = import.meta.env.VITE_Play_Secret_Key;
    const voiceId = 'en-US-AshleyNeural'; // Default voice

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const handleGenerateAudio = async () => {
        if (!text.trim()) return;

        setIsLoading(true);
        setAudioSrc('');

        try {
            // STEP 1: Request TTS generation
            const response = await fetch('https://play.ht/api/v2/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId,
                    'X-User-Secret': secretKey
                },
                body: JSON.stringify({
                    text: text.trim(),
                    voice: voiceId
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const jobId = data.transcriptionId;

            // STEP 2: Poll until the audio is ready
            const audioUrl = await pollForAudio(jobId);

            // STEP 3: Play the audio
            setAudioSrc(audioUrl);
            setIsLoading(false);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                await audioRef.current.play();
            }

        } catch (error) {
            console.error('Error generating audio:', error);
            setIsLoading(false);
        }
    };

    const pollForAudio = async (jobId: string): Promise<string> => {
        const statusUrl = `https://play.ht/api/v2/tts/${jobId}`;

        // Keep polling until status is 'converted'
        while (true) {
            await new Promise(r => setTimeout(r, 3000)); // wait 3 seconds between checks
            const statusRes = await fetch(statusUrl, {
                headers: {
                    'X-User-ID': userId,
                    'X-User-Secret': secretKey
                }
            });

            const statusData = await statusRes.json();

            if (statusData.status === 'converted' && statusData.audioUrl) {
                return statusData.audioUrl;
            }

            if (statusData.status === 'failed') {
                throw new Error('Audio generation failed.');
            }
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
