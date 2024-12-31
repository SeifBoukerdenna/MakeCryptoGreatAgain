import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/LoadingScreen.css';

interface LoadingScreenProps {
    onLoadingComplete: () => void;
}

const loadingMessages = {
    early: [
        "Syncing the blockchain...",
        "Initializing smart contracts...",
        "Loading your crypto journey...",
        "Preparing the blockchain...",
    ],
    middle: [
        "Loading famous people...",
        "Preparing Trump's tweets...",
        "Waking up Elon Musk...",
        "Getting Andrew Tate's opinions...",
        "Loading crypto influencers..."
    ],
    late: [
        "Done! Enjoy your story",
        "Ready to make history!",
        "Let's make crypto great again!",
        "Time to change the game!",
        "Your crypto adventure awaits!",
        "Ready to meet the legends!",
        "The stage is set!",
        "Let's make moves!"
    ]
};

const getRandomMessage = (messages: string[]): string => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
};

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
    const [progress, setProgress] = useState(0);
    // Select the three messages upfront
    const [selectedMessages] = useState({
        early: getRandomMessage(loadingMessages.early),
        middle: getRandomMessage(loadingMessages.middle),
        late: getRandomMessage(loadingMessages.late)
    });
    const [currentMessage, setCurrentMessage] = useState(selectedMessages.early);

    useEffect(() => {
        const loadingTime = Math.random() * (3000 - 1000) + 1000;
        const interval = 10;
        const steps = loadingTime / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newProgress = (currentStep / steps) * 100;

            if (newProgress >= 100) {
                clearInterval(timer);
                setTimeout(() => {
                    onLoadingComplete();
                }, 500);
            }

            setProgress(Math.min(newProgress, 100));
        }, interval);

        return () => clearInterval(timer);
    }, [onLoadingComplete]);

    // Update message based on progress thresholds
    useEffect(() => {
        if (progress >= 0 && progress < 33) {
            setCurrentMessage(selectedMessages.early);
        } else if (progress >= 33 && progress < 66) {
            setCurrentMessage(selectedMessages.middle);
        } else if (progress >= 66) {
            setCurrentMessage(selectedMessages.late);
        }
    }, [progress, selectedMessages]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-screen"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="loading-content"
            >
                <h1 className="loading-title">
                    Make Crypto Great Again
                </h1>
                <p className="loading-subtitle">
                    Loading your story with famous people...
                </p>
            </motion.div>

            <div className="progress-container">
                <div className="progress-bar-bg">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="progress-bar"
                    />
                </div>
            </div>

            <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="loading-message"
            >
                {currentMessage}
            </motion.p>
        </motion.div>
    );
};

export default LoadingScreen;