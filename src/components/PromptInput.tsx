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
    const hasSufficientTokens =
        mcgaBalance !== null && mcgaBalance >= Price.exportVideo;

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognitionConstructor =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionConstructor) {
            recognitionRef.current = new SpeechRecognitionConstructor();
            if (recognitionRef.current) {
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (
                    event: SpeechRecognitionEvent
                ) => {
                    const transcript = event.results[0][0].transcript;
                    setValue((prev) =>
                        prev ? `${prev} ${transcript}` : transcript
                    );
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
            console.warn(
                'Speech Recognition API is not supported in this browser.'
            );
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
            return `You need at least ${formatToK(
                Price.exportVideo
            )} MCGA tokens to use this feature.`;
        }
        if (!isChromium) {
            return 'This feature is only supported in Chrome.';
        }
        return 'Record a short format video of the answer';
    };

    const cameraButtonDisabled = !hasSufficientTokens || !isChromium;

    return (
        <>
            {/*
              Container for the input and buttons
              Desktop: single row
              Mobile: stack (see global.css @media)
            */}
            <div className="prompt-input-container">
                {/* Text input */}
                <input
                    className="text-input"
                    type="text"
                    placeholder="Ask your question..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />

                {/* Buttons group (Video, Mic, Send) */}
                <div className="button-group">
                    {/* Camera Button with Tooltip */}
                    <Tooltip message={getTooltipMessage()}>
                        <button
                            type="button"
                            onClick={toggleShouldRecord}
                            className={`camera-button ${shouldRecord ? 'active' : ''
                                } ${cameraButtonDisabled ? 'disabled' : ''}`}
                            disabled={cameraButtonDisabled}
                            aria-disabled={cameraButtonDisabled}
                            aria-label="Toggle video"
                        >
                            {shouldRecord ? (
                                <Video className="w-5 h-5" />
                            ) : (
                                <VideoOff className="w-5 h-5" />
                            )}
                        </button>
                    </Tooltip>

                    {/* Microphone Button */}
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`mic-button ${isListening ? 'active' : ''}`}
                        aria-label="Toggle microphone"
                    >
                        {isListening ? (
                            <Mic className="w-5 h-5" />
                        ) : (
                            <MicOff className="w-5 h-5" />
                        )}
                    </button>

                    {/* Send Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!value.trim()}
                        className="send-button"
                    >
                        Send
                    </button>
                </div>
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
