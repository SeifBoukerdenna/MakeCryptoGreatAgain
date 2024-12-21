import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import useConversationStore from '../stores/useConversationStore';
import Waveform from './WaveForm';

interface MessageBubbleProps {
    text: string;
    sender: 'user' | 'character';
    status: 'loading' | 'playing' | 'complete';
    voiceConfig?: {
        voiceId: string;
        engine?: string;
    };
    index: number;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    text,
    sender,
    status,
    voiceConfig,
    index
}) => {
    const { sendTTSRequest } = useTTS();
    const { updateMessageAtIndex } = useConversationStore();
    const [isMessagePlaying, setIsMessagePlaying] = useState(false);

    const handleReplay = async () => {
        if (sender === 'character' && voiceConfig && !isMessagePlaying) {
            setIsMessagePlaying(true);
            updateMessageAtIndex(index, text, 'playing');

            try {
                await sendTTSRequest(
                    text,
                    voiceConfig,
                    // Callback when audio starts
                    () => {
                        updateMessageAtIndex(index, text, 'playing');
                    }
                );
            } finally {
                setIsMessagePlaying(false);
                updateMessageAtIndex(index, text, 'complete');
            }
        }
    };

    const displayText = text || (status === 'loading' ? 'Thinking...' : text);

    return (
        <div className={`message ${sender} ${status} relative group`}>
            {displayText}

            {/* Only show waveform when status is 'playing' */}
            {sender === 'character' && status === 'playing' && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <Waveform />
                </div>
            )}

            {/* Show replay button for character messages that are complete */}
            {sender === 'character' && status === 'complete' && (
                <button
                    onClick={handleReplay}
                    className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100
                     transition-opacity duration-200 p-1 rounded-full
                     bg-[var(--button-bg)] hover:bg-[var(--button-hover-bg)] text-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isMessagePlaying}
                    aria-label="Replay message"
                >
                    <Play size={16} />
                </button>
            )}
        </div>
    );
};

export default MessageBubble;