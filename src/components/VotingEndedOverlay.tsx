import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface VotingEndedOverlayProps {
    winningCharacter: {
        name: string;
        votes: number;
        percentage?: number;
    };
    totalVotes: number;
}

const VotingEndedOverlay: React.FC<VotingEndedOverlayProps> = ({ winningCharacter, totalVotes }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="voting-ended-overlay"
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="winner-card"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="trophy-container"
                >
                    <Trophy className="trophy-icon" />
                </motion.div>

                <h2 className="winner-title">
                    Voting Period Ended
                </h2>

                <div className="winner-subtitle">
                    <Star className="star-icon" />
                    <span>Winner Announced</span>
                    <Star className="star-icon" />
                </div>

                <div className="winner-info">
                    <h3 className="winner-name">
                        {winningCharacter.name}
                    </h3>
                    <p className="winner-votes">
                        Won with {winningCharacter.votes.toLocaleString()} votes
                    </p>
                    <div className="stats-container">
                        <div className="stat-box">
                            <div className="stat-value">
                                {winningCharacter.percentage?.toFixed(1)}%
                            </div>
                            <div className="stat-label">of total votes</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-box">
                            <div className="stat-value">
                                {totalVotes.toLocaleString()}
                            </div>
                            <div className="stat-label">total votes cast</div>
                        </div>
                    </div>
                </div>

                <p className="thank-you-message">
                    Thank you for participating! The winning character will be added to the platform soon.
                </p>
            </motion.div>
        </motion.div>
    );
};

export default VotingEndedOverlay;