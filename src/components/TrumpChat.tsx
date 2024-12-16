import { useState } from 'react';
import { convertTextToSpeech } from '../utils/playht';

const TrumpChat = () => {
    const [message, setMessage] = useState('');
    const [responses, setResponses] = useState<{ type: string; text: string; }[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;

        // Add user message
        setResponses(prev => [...prev, { type: 'user', text: message }]);

        // Simulate Trump response
        const trumpResponse = "Folks, let me tell you, that's a fantastic question. Nobody knows more about this than me, believe me!";

        // Add Trump response
        setResponses(prev => [...prev, { type: 'trump', text: trumpResponse }]);

        try {
            // Convert to speech
            const audioUrl = await convertTextToSpeech(trumpResponse);
            const audio = new Audio(audioUrl);
            setIsPlaying(true);
            audio.play();
            audio.onended = () => setIsPlaying(false);
        } catch (error) {
            console.error('Speech conversion failed:', error);
        }

        setMessage('');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <div className="flex-1 p-4 overflow-y-auto">
                {responses.map((response, index) => (
                    <div
                        key={index}
                        className={`mb-4 p-3 rounded-lg max-w-[80%] ${response.type === 'user'
                            ? 'ml-auto bg-blue-600'
                            : 'bg-red-600'
                            }`}
                    >
                        {response.text}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Type your message..."
                        className="flex-1 p-2 rounded bg-gray-700 text-white"
                        disabled={isPlaying}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isPlaying}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded font-bold disabled:opacity-50"
                    >
                        {isPlaying ? 'Speaking...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrumpChat;