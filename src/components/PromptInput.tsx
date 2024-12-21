// src/components/PromptInput.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

interface PromptInputProps {
    onSubmit: (prompt: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit }) => {
    const [value, setValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        // Check for browser support
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

    return (
        <div className="message-input-container flex items-center relative">
            <input
                type="text"
                placeholder="Ask your question..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="message-input placeholder-gray-400 flex-1 p-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
            />
            {/* Microphone Icon Inside Input */}
            <button
                type="button"
                onClick={toggleListening}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-transparent focus:outline-none"
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
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="send-button ml-3 px-4 py-2 bg-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
                Send
            </button>
        </div>
    );
};

export default PromptInput;
