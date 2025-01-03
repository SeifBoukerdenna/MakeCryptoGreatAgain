// src/components/Social.tsx

import '../styles/social.css';
import CharacterStats from '../components/CharacterStats';
import { useMessageStats } from '../hooks/useMessageStats';
import EngagementLeaderboard from '../components/EngagementLeaderboard';
import SocialTour from '../components/tours/SocialTour';

const Social = () => {
    const { characterStats, isLoading, error } = useMessageStats();


    return (
        <div className="social-container">
            <h1 className="text-3xl font-bold mb-8 text-center">MCGA Community</h1>
            <SocialTour />
            <EngagementLeaderboard />

            <CharacterStats
                characterStats={characterStats}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
};

export default Social;
