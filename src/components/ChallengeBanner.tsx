import { motion } from 'framer-motion';
import { Star, Rocket, Lock, Trophy, InfoIcon } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import '../styles/ChallengeBanner.css';

const ChallengeBanner = () => {
    const { connected } = useWallet();
    const navigate = useNavigate();

    const features = [
        {
            icon: Trophy,
            title: "Token Rewards",
            description: "Win MCGA tokens for successful solutions",
            colorClass: "yellow",
        },
        {
            icon: Lock,
            title: "Smart Contracts",
            description: "Secure, transparent challenge verification",
            colorClass: "purple",
        },
        {
            icon: Star,
            title: "Unique Challenges",
            description: "Character-specific puzzles and riddles",
            colorClass: "pink",
        },
        {
            icon: Rocket,
            title: "Boost Rewards",
            description: "Hold MCGA to reduce cooldowns",
            colorClass: "blue",
        },
    ];

    return (
        <div className="challenge-banner">
            <motion.div
                className="banner-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Background Elements */}
                <motion.div className="bg-element bg-element-1" />
                <motion.div className="bg-element bg-element-2" />

                <motion.div
                    className="banner-card"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="banner-content">
                        {/* Title Section */}
                        <motion.div
                            className="title-section"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="banner-title">
                                Character Challenges Unlocking Soon
                            </h1>
                            <button
                                className="info-button"
                                onClick={() => navigate('/about')}
                                aria-label="More information about challenges"
                            >
                                <InfoIcon size={24} />
                                <span className="tooltip">Learn more here</span>
                            </button>
                        </motion.div>

                        {/* Description Section */}
                        <motion.div
                            className="description-section"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <p className="banner-description">
                                Prepare for an epic adventure where you'll solve unique challenges,
                                compete with players worldwide, and earn exclusive MCGA token rewards.
                            </p>
                        </motion.div>

                        {/* Features Section */}
                        <motion.div
                            className="features-section"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="features-grid">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        className="feature-card"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 * index + 0.5 }}
                                        whileHover={{ y: -8 }}
                                    >
                                        <feature.icon className={`feature-icon ${feature.colorClass}`} />
                                        <h3 className="feature-title">{feature.title}</h3>
                                        <p className="feature-description">{feature.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Wallet Section */}
                        <motion.div
                            className="wallet-section"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                        >
                            <div className="wallet-status">
                                <p className="wallet-status-text">
                                    {connected
                                        ? "Your wallet is connected and ready for the challenges!"
                                        : "Connect your wallet now to be ready when challenges launch!"
                                    }
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ChallengeBanner;