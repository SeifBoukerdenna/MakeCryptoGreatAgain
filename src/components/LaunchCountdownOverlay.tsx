import React, { useState, useEffect } from 'react';
import { Trophy, Star, X } from 'lucide-react';
import { motion } from 'framer-motion';

const LaunchCountdownOverlay = () => {
    const [countdown, setCountdown] = useState('');
    const [showOverlay, setShowOverlay] = useState(() => {
        // Check if the overlay has been dismissed before
        const dismissed = localStorage.getItem('launchCountdownDismissed');
        return !dismissed;
    });

    useEffect(() => {
        const targetDate = new Date('2025-01-19T17:00:00-05:00'); // January 19th, 5pm EST

        const updateCountdown = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                setCountdown('Launch time!');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleDismiss = () => {
        setShowOverlay(false);
        localStorage.setItem('launchCountdownDismissed', 'true');
        document.body.style.overflow = 'auto';
    };

    if (!showOverlay) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="voting-ended-overlay"
            aria-modal="true"
            role="dialog"
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="winner-card"
            >
                <button
                    onClick={handleDismiss}
                    className="close-button"
                    aria-label="Close Overlay"
                >
                    <X className="close-icon" />
                </button>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="trophy-container"
                >
                    <Trophy className="trophy-icon" />
                </motion.div>

                <h2 className="winner-title">
                    Token Launch Countdown
                </h2>

                <div className="winner-subtitle">
                    <Star className="star-icon" />
                    <span>January 19th, 5PM EST</span>
                    <Star className="star-icon" />
                </div>

                <div className="winner-info">
                    <h3 className="winner-name">
                        Time until launch
                    </h3>
                    <p className="winner-votes">
                        {countdown}
                    </p>
                    <div className="stats-container">
                        <div className="stat-box">
                            <div className="stat-label">Stay Updated</div>
                            <div className="stat-value">
                                <a
                                    href="https://x.com/_crypto_celeb_"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-link"
                                >
                                    Follow on Twitter
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="thank-you-message">
                    Get ready for the launch of MCGA token! Connect your wallet and start earning rewards.
                </p>
            </motion.div>
        </motion.div>
    );
};

export default LaunchCountdownOverlay;