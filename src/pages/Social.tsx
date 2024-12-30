// src/components/Social.tsx

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, ParsedAccountData } from '@solana/web3.js';
import { MCGA_TOKEN_MINT } from '../constants/tokens';
import { formatToK } from '../utils/numberFormat';
import { Copy, Check } from 'lucide-react';
import '../styles/social.css';
import CharacterStats from '../components/CharacterStats';
import { useMessageStats } from '../hooks/useMessageStats';
import EngagementLeaderboard from '../components/EngagementLeaderboard';

const Social = () => {
    const { characterStats, isLoading, error } = useMessageStats();


    return (
        <div className="social-container">
            <h1 className="text-3xl font-bold mb-8 text-center">MCGA Community</h1>

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
