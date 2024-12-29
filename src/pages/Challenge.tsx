// src/pages/Challenge.tsx
import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
    Lock,
    Unlock,
    RefreshCw,
    Check,
    X,
    Timer,
    Wallet,
    Copy,
    Coins,
} from 'lucide-react';
import { charactersConfig } from '../configs/characters.config';
import { formatTimeRemaining } from '../utils/time';
import { truncateAddress } from '../utils/adress';
import { useChallengeLogic } from '../hooks/useChallengeLogic';
import { supabase } from '../lib/supabase';
import '../styles/challenge.css';

interface PoolInfo {
    pool_address: string;
    pool_token_account: string;
    seed: string;
    created_at: string;
    character_id: string;
}

const ChallengePage = () => {
    const { connected } = useWallet();
    const { connection } = useConnection();

    // State for pools
    const [poolInfos, setPoolInfos] = useState<Record<string, PoolInfo>>({});
    const [poolBalances, setPoolBalances] = useState<Record<string, number>>({});
    const [_, setIsLoadingPools] = useState(true);

    // Get challenge logic
    const {
        guesses, setGuesses,
        results,
        isLoading,
        submittingId,
        totalAttempts,
        winners,
        copiedStates,
        handleGuess,
        handleCopy,
        getCooldownRemaining,
    } = useChallengeLogic();

    // Fetch pool information on mount
    useEffect(() => {
        fetchPoolInfo();
    }, []);

    // Fetch pool balances whenever pool info changes
    useEffect(() => {
        if (Object.keys(poolInfos).length > 0) {
            fetchPoolBalances();
            const interval = setInterval(fetchPoolBalances, 30000); // Refresh every 30s
            return () => clearInterval(interval);
        }
    }, [poolInfos, connection]);

    // Fetch all pool information
    const fetchPoolInfo = async () => {
        try {
            setIsLoadingPools(true);
            const { data, error } = await supabase
                .from('pool_info')
                .select('*');

            if (error) throw error;

            const infoMap: Record<string, PoolInfo> = {};
            data?.forEach(pool => {
                infoMap[pool.character_id] = pool;
            });
            setPoolInfos(infoMap);
        } catch (err) {
            console.error('Error fetching pool info:', err);
        } finally {
            setIsLoadingPools(false);
        }
    };

    // Fetch balances for all pools
    const fetchPoolBalances = async () => {
        const balances: Record<string, number> = {};

        for (const [characterId, poolInfo] of Object.entries(poolInfos)) {
            try {
                const tokenAccount = new PublicKey(poolInfo.pool_token_account);
                const balance = await connection.getTokenAccountBalance(tokenAccount);
                balances[characterId] = balance.value.uiAmount || 0;
            } catch (err) {
                console.error(`Error fetching balance for character ${characterId}:`, err);
                balances[characterId] = 0;
            }
        }

        setPoolBalances(balances);
    };


    // UI Section
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Character Challenges
            </h1>

            {/* Stats Section */}
            <div className="token-holder-card">
                <div className="holder-stats">
                    <div className="stat-item">
                        <div className="stat-label">Total Characters</div>
                        <div className="stat-value">{charactersConfig.length}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Total Attempts</div>
                        <div className="stat-value">{totalAttempts}</div>
                    </div>
                </div>

                {/* Character Grid */}
                <div className="challenge-grid">
                    {charactersConfig.map((character) => {
                        const cooldownMs = getCooldownRemaining(character.id);
                        const hasResult = results[character.id] !== undefined;
                        const isCorrect = results[character.id];
                        const isCooldown = cooldownMs > 0;
                        const isSolved = !!winners[character.id];
                        const poolBalance = poolBalances[character.id] || 0;
                        const hasPool = !!poolInfos[character.id];

                        return (
                            <div
                                key={character.id}
                                className={`challenge-card ${isSolved ? 'solved' : hasResult ? (isCorrect ? 'success' : 'error') : ''}`}
                            >
                                {/* Card Header */}
                                <div className="header">
                                    <img src={character.avatar} alt={character.name} />
                                    <div className="header-content">
                                        <h3>{character.name}</h3>
                                        {hasPool && (
                                            <div className="pool-info">
                                                <Coins className="h-4 w-4" />
                                                <span className="pool-balance">
                                                    {poolBalance.toLocaleString()} MCGA
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="content">
                                    <input
                                        type="text"
                                        placeholder={
                                            !connected
                                                ? 'Connect wallet first'
                                                : !hasPool
                                                    ? 'Pool not initialized'
                                                    : isSolved
                                                        ? 'Solved'
                                                        : isCooldown
                                                            ? 'Waiting for cooldown...'
                                                            : 'Enter the secret phrase...'
                                        }
                                        value={guesses[character.id] || ''}
                                        onChange={(e) => setGuesses({
                                            ...guesses,
                                            [character.id]: e.target.value,
                                        })}
                                        disabled={!hasPool || isCooldown || !connected || isSolved}
                                    />

                                    {/* Status Section */}
                                    <div className="status">
                                        <div className="status-indicator">
                                            <div className="status-icon">
                                                {!connected ? (
                                                    <Lock />
                                                ) : !hasPool ? (
                                                    <Lock />
                                                ) : isSolved ? (
                                                    <Check color="#10B981" />
                                                ) : hasResult ? (
                                                    isCorrect ? (
                                                        <Check color="#10B981" />
                                                    ) : (
                                                        <X color="#EF4444" />
                                                    )
                                                ) : isCooldown ? (
                                                    <Lock />
                                                ) : (
                                                    <Unlock />
                                                )}
                                            </div>
                                            <div className="status-text">
                                                {!connected
                                                    ? 'Wallet not connected'
                                                    : !hasPool
                                                        ? 'Pool not initialized'
                                                        : isSolved
                                                            ? 'Secret found'
                                                            : hasResult
                                                                ? isCorrect
                                                                    ? 'Correct!'
                                                                    : 'Wrong answer'
                                                                : isCooldown
                                                                    ? 'Cooldown active'
                                                                    : 'Ready to guess'}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => handleGuess(character.id)}
                                            disabled={!hasPool || isCooldown || !connected || isLoading || isSolved}
                                            className={`challenge-button ${isCooldown || isSolved ? 'cooldown' : 'ready'}`}
                                        >
                                            {!connected ? (
                                                <>
                                                    <Wallet className="w-4 h-4" />
                                                    Connect Wallet
                                                </>
                                            ) : !hasPool ? (
                                                'Pool Not Ready'
                                            ) : submittingId === character.id ? (
                                                <>
                                                    <RefreshCw className="animate-spin" />
                                                    Checking...
                                                </>
                                            ) : isSolved ? (
                                                'Solved'
                                            ) : isCooldown ? (
                                                <>
                                                    <Timer />
                                                    {formatTimeRemaining(cooldownMs)}
                                                </>
                                            ) : (
                                                'Submit'
                                            )}
                                        </button>
                                    </div>

                                    {/* Overlays */}
                                    {isCooldown && (
                                        <div className="cooldown-overlay">
                                            <div className="cooldown-timer">
                                                <Timer />
                                                Next attempt in {formatTimeRemaining(cooldownMs)}
                                            </div>
                                        </div>
                                    )}

                                    {!connected && !isCooldown && !isSolved && (
                                        <div className="connect-wallet-overlay">
                                            <div className="connect-wallet-message">
                                                <Wallet />
                                                Connect wallet to participate
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Winners Section */}
            <div className="winner-section">
                <h2 className="text-2xl font-bold mb-4 text-center">Winners</h2>
                <div className="winner-grid">
                    {charactersConfig.map((character) => (
                        <div key={character.id} className="winner-card">
                            <img
                                src={character.avatar}
                                alt={character.name}
                                className="winner-avatar"
                            />
                            <h3 className="winner-name">{character.name}</h3>
                            {winners[character.id] ? (
                                <div className="winner-address">
                                    <button
                                        onClick={() => handleCopy(winners[character.id])}
                                        className="copy-address-button"
                                        title="Click to copy wallet address"
                                    >
                                        <span>{truncateAddress(winners[character.id])}</span>
                                        {copiedStates[winners[character.id]] ? (
                                            <Check className="copy-icon" size={16} />
                                        ) : (
                                            <Copy className="copy-icon" size={16} />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="no-winner">No winners yet</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChallengePage;