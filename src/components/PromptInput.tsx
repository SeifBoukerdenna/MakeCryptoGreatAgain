// src/components/PromptInput.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import VideoPreviewOverlay from './VideoPreviewOverlay';
import useShouldRecordStore from '../stores/useShouldRecordStore';
import Tooltip from './Tooltip';
import useBalanceStore from '../hooks/useBalanceStore';
import { Price } from '../constants/price';
import useIsChromium from '../hooks/useIsChromium';
import { formatToK } from '../utils/numberFormat';

interface PromptInputProps {
    onSubmit: (prompt: string) => void;
    videoBlob: Blob | null;
    clearVideoBlob: () => void;
}

const PromptInput: React.FC<PromptInputProps> = ({
    onSubmit,
    videoBlob,
    clearVideoBlob
}) => {
    const [value, setValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const { shouldRecord, toggleShouldRecord } = useShouldRecordStore();
    const isChromium = useIsChromium();

    // Access mcgaBalance from the balance store
    const mcgaBalance = useBalanceStore((state) => state.mcgaBalance);

    // Determine if the user has at least 50,000 MCGA
    const hasSufficientTokens = mcgaBalance !== null && mcgaBalance >= Price.exportVideo;

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognitionConstructor =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

    const getTooltipMessage = () => {
        if (!hasSufficientTokens) {
            return `You need at least ${formatToK(Price.exportVideo)} MCGA tokens to use this feature.`;
        }
        if (!isChromium) {
            return "This feature is only supported in Chrome.";
        }
        return "Record a short format video of the answer";
    };

    const cameraButtonDisabled = !hasSufficientTokens || !isChromium;

    return (
        <>
            <div className="message-input-container flex items-center relative">
                <input
                    type="text"
                    placeholder="Ask your question..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="message-input placeholder-gray-400 flex-1 p-3 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
                />

                {/* Camera Button with Tooltip */}
                <Tooltip message={getTooltipMessage()}>
                    <button
                        type="button"
                        onClick={toggleShouldRecord}
                        className={`camera-button p-2 rounded-full focus:outline-none transition-transform ${shouldRecord ? 'active' : ''
                            } ${cameraButtonDisabled ? 'disabled' : ''}`}
                        aria-label="Toggle video"
                        disabled={cameraButtonDisabled}
                        aria-disabled={cameraButtonDisabled}
                    >
                        {shouldRecord ? (
                            <Video className="w-5 h-5" />
                        ) : (
                            <VideoOff className="w-5 h-5" />
                        )}
                    </button>
                </Tooltip>

                {/* Microphone Icon */}
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`mic-button p-2 rounded-full focus:outline-none transition-transform ${isListening ? 'active' : ''
                        }`}
                    aria-label="Toggle microphone"
                >
                    {isListening ? (
                        <Mic className="w-5 h-5" />
                    ) : (
                        <MicOff className="w-5 h-5" />
                    )}
                </button>

                {/* Send button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!value.trim()}
                    className="send-button absolute right-0 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                    Send
                </button>
            </div>

            {/* Video Preview Overlay */}
            {videoBlob && shouldRecord && (
                <VideoPreviewOverlay
                    videoBlob={videoBlob}
                    onClose={clearVideoBlob}
                />
            )}
        </>
    );
};

export default PromptInput;
