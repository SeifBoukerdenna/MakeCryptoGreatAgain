// src/components/PromptInput.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video } from 'lucide-react'; // Import a video icon
import VideoPreviewOverlay from './VideoPreviewOverlay'; // Ensure this component exists

interface PromptInputProps {
    onSubmit: (prompt: string) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, audioRef }) => {
    const [value, setValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [showVideoPreview, setShowVideoPreview] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionConstructor) {
            recognitionRef.current = new SpeechRecognitionConstructor();
            if (recognitionRef.current) {
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = event.results[0][0].transcript;
                    setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        } else {
            console.warn('Speech Recognition API is not supported in this browser.');
        }
    }, []);

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (error) {
                    console.error('Error starting speech recognition:', error);
                }
            } else {
                alert('Speech Recognition is not supported in your browser.');
            }
        }
    };

    const handleGenerateVideo = async () => {
        if (!window.MediaRecorder) {
            alert('MediaRecorder API is not supported in your browser.');
            return;
        }

        if (!audioRef.current) {
            alert('Audio is not available for recording.');
            return;
        }

        setIsGeneratingVideo(true);
        try {
            // Initialize canvas for avatar animation
            const canvas = document.createElement('canvas');
            const avatarElement = document.querySelector('.selected-character-icon img') as HTMLImageElement;
            if (!avatarElement) throw new Error('Avatar element not found');

            // Set canvas dimensions (vertical format for YT Shorts/Reels)
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Unable to get canvas context');

            // Draw the avatar with a green circle
            const avatarImg = new Image();
            avatarImg.src = avatarElement.src;
            await new Promise<void>((resolve) => {
                avatarImg.onload = () => resolve();
            });

            // Draw initial frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const avatarWidth = 300; // Adjust as needed
            const avatarHeight = 300; // Adjust as needed
            ctx.drawImage(avatarImg, (canvas.width - avatarWidth) / 2, 200, avatarWidth, avatarHeight);
            ctx.beginPath();
            ctx.arc(canvas.width / 2, 200 + avatarHeight / 2, Math.max(avatarWidth, avatarHeight) / 2 + 10, 0, 2 * Math.PI);
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Prepare MediaRecorder
            const canvasStream = canvas.captureStream(30); // 30 FPS
            const audioStream = (audioRef.current as any).captureStream(); // Type assertion

            if (!audioStream) throw new Error('Audio stream not available');

            // Combine canvas and audio streams
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioStream.getAudioTracks(),
            ]);

            mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp8,opus' });
            recordedChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                setVideoBlob(blob);
                setShowVideoPreview(true);
                setIsGeneratingVideo(false);
            };

            mediaRecorderRef.current.start();

            // Animate avatar (simple pulsing effect) while audio is playing
            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(avatarImg, (canvas.width - avatarWidth) / 2, 200, avatarWidth, avatarHeight);
                const pulse = Math.abs(Math.sin(Date.now() / 200)) * 10 + 10; // Pulsing radius
                ctx.beginPath();
                ctx.arc(
                    canvas.width / 2,
                    200 + avatarHeight / 2,
                    Math.max(avatarWidth, avatarHeight) / 2 + pulse,
                    0,
                    2 * Math.PI
                );
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 5;
                ctx.stroke();

                if (mediaRecorderRef.current?.state === 'recording') {
                    requestAnimationFrame(animate);
                }
            };

            animate();

            // Stop recording when audio ends
            audioRef.current.onended = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
            };

            // Ensure MediaRecorder stops if the audio is already ended
            if (audioRef.current.paused) {
                mediaRecorderRef.current.stop();
            }
        } catch (error) {
            console.error('Error generating video:', error);
            setIsGeneratingVideo(false);
        }
    };

    return (
        <>
            <div className="message-input-container flex items-center relative">
                <input
                    type="text"
                    placeholder="Ask your question..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="message-input placeholder-gray-400 flex-1 p-3 pr-24 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
                />
                {/* Microphone Icon Inside Input */}
                <button
                    type="button"
                    onClick={toggleListening}
                    className="absolute right-16 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-transparent focus:outline-none"
                    aria-label="Toggle microphone"
                    style={{
                        color: isListening ? 'var(--button-hover-bg)' : 'var(--input-placeholder)',
                    }}
                >
                    {isListening ? (
                        <MicOff className="w-5 h-5" />
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>

                {/* Generate Video Button */}
                <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-transparent focus:outline-none"
                    aria-label="Generate Video"
                >
                    <Video className="w-5 h-5" />
                </button>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!value.trim()}
                    className="send-button absolute right-0 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                    Send
                </button>
            </div>

            {/* Hidden Canvas (for video generation) */}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            {/* Video Preview Overlay */}
            {showVideoPreview && videoBlob && (
                <VideoPreviewOverlay
                    videoBlob={videoBlob}
                    onClose={() => setShowVideoPreview(false)}
                />
            )}
        </>
    );
};

export default PromptInput;
