// src/pages/Challenge.tsx

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import {
    Lock,
    Unlock,
    RefreshCw,
    Check,
    X,
    Timer,
    Wallet,
    Copy
} from 'lucide-react';
import { charactersConfig } from '../configs/characters.config';
import '../styles/challenge.css';
import { truncateAddress } from '../utils/adress';

// Adjusted cooldown duration for testing (e.g., 6 seconds).
// Change to 5 * 60 * 1000 for 5 minutes.
const COOLDOWN_DURATION = 0.1 * 60 * 1000; // 6 seconds in milliseconds

interface CharacterChallenge {
    character_id: string;
    wallet_address: string;
    success: boolean;
    last_attempt: string | null; // Updated to match upsert logic
    attempts: number;
}

const ChallengePage = () => {
    const { connected, publicKey } = useWallet();
    const [guesses, setGuesses] = useState<Record<string, string>>({});
    const [cooldowns, setCooldowns] = useState<Record<string, Date>>({});
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [totalAttempts, setTotalAttempts] = useState<number>(0);
    const [winners, setWinners] = useState<Record<string, string>>({});
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    // 1. Update timer every second to refresh cooldowns
    useEffect(() => {
        const timer = setInterval(() => {
            setCooldowns((prev) => ({ ...prev }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Clean up expired cooldowns and clear results for expired cooldowns
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            setCooldowns((prevCooldowns) => {
                const now = Date.now();
                const newCooldowns: Record<string, Date> = {};
                const expiredIds: string[] = [];

                Object.entries(prevCooldowns).forEach(([id, date]) => {
                    if (now - date.getTime() < COOLDOWN_DURATION) {
                        newCooldowns[id] = date;
                    } else {
                        expiredIds.push(id);
                    }
                });

                // Remove results for expired cooldowns
                if (expiredIds.length > 0) {
                    setResults((prevResults) => {
                        const updatedResults = { ...prevResults };
                        expiredIds.forEach((id) => {
                            delete updatedResults[id];
                        });
                        return updatedResults;
                    });
                }

                return newCooldowns;
            });
        }, 1000);

        return () => clearInterval(cleanupInterval);
    }, []);

    // 3. Fetch cooldowns when wallet is connected or disconnected
    useEffect(() => {
        if (publicKey) {
            fetchUserCooldowns();
        } else {
            setCooldowns({});
        }
    }, [publicKey]);

    // 4. Fetch total attempts on page load and whenever there's a guess submission
    useEffect(() => {
        fetchTotalAttempts();
    }, [submittingId]);

    // 5. Fetch winners on page load and set up realtime subscription
    useEffect(() => {
        fetchWinners();

        const subscription = supabase
            .channel('character_challenges')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'character_challenges' }, payload => {
                console.log('INSERT payload:', payload);
                const newRecord = payload.new as CharacterChallenge;
                if (newRecord.success) {
                    setWinners((prev) => ({
                        ...prev,
                        [newRecord.character_id]: newRecord.wallet_address,
                    }));
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'character_challenges' }, payload => {
                console.log('UPDATE payload:', payload);
                const updatedRecord = payload.new as CharacterChallenge;
                if (updatedRecord.success) {
                    setWinners((prev) => ({
                        ...prev,
                        [updatedRecord.character_id]: updatedRecord.wallet_address,
                    }));
                }
            })
            .subscribe();

        // Polling as a fallback every 60s
        const interval = setInterval(fetchWinners, 60000);

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, []);

    // --- Supabase / Data Fetching Functions ---

    const fetchUserCooldowns = async () => {
        if (!publicKey) return;
        const { data, error } = await supabase
            .from('character_challenges')
            .select('character_id, last_attempt')
            .eq('wallet_address', publicKey.toString());

        if (error) {
            console.error('Error fetching cooldowns:', error);
            return;
        }

        if (data) {
            const newCooldowns: Record<string, Date> = {};
            data.forEach((record: any) => {
                if (record.last_attempt) {
                    const attemptDate = new Date(record.last_attempt);
                    newCooldowns[record.character_id] = attemptDate;
                }
            });
            setCooldowns(newCooldowns);
        }
    };

    const fetchTotalAttempts = async () => {
        const { data, error } = await supabase
            .from('character_challenges')
            .select('attempts');

        if (error) {
            console.error('Error fetching total attempts:', error);
            return;
        }

        if (data && Array.isArray(data)) {
            const total = data.reduce(
                (acc: number, row: any) => acc + (row.attempts || 0),
                0
            );
            setTotalAttempts(total);
        }
    };

    const fetchWinners = async () => {
        try {
            const { data, error } = await supabase
                .from('character_challenges')
                .select('*')
                .eq('success', true)
                .order('last_attempt', { ascending: false });

            if (error) throw error;

            if (data) {
                const winnersMap: Record<string, string> = {};
                data.forEach((record: CharacterChallenge) => {
                    const { character_id, wallet_address } = record;
                    // If character_id is not yet in the map, add it
                    if (!winnersMap[character_id]) {
                        winnersMap[character_id] = wallet_address;
                    }
                });
                setWinners(winnersMap);
            }
        } catch (error) {
            console.error('Error fetching winners:', error);
        }
    };

    // --- Core Guess Logic ---

    const handleGuess = async (characterId: string) => {
        if (!publicKey || !connected) return;

        // If character is already solved, don't allow guess
        if (winners[characterId]) {
            return;
        }

        // If user is on cooldown, don't allow guess
        const lastAttempt = cooldowns[characterId];
        if (lastAttempt && Date.now() - lastAttempt.getTime() < COOLDOWN_DURATION) {
            return;
        }

        setIsLoading(true);
        setSubmittingId(characterId);

        try {
            // 1. Fetch the secret from supabase
            const { data: secretData, error } = await supabase
                .from('character_secrets')
                .select('secret')
                .eq('character_id', characterId)
                .single();

            if (error) throw error;
            if (!secretData) return;

            // 2. Compare user's guess with the correct secret
            const userGuess = guesses[characterId]?.trim().toLowerCase() || '';
            const correctAnswer = secretData.secret.trim().toLowerCase();
            const isCorrect = userGuess === correctAnswer;

            setResults((prev) => ({ ...prev, [characterId]: isCorrect }));

            // 3. Fetch existing row to increment attempts
            const { data: existing, error: existingError } = await supabase
                .from('character_challenges')
                .select('*')
                .eq('wallet_address', publicKey.toString())
                .eq('character_id', characterId)
                .single();

            let currentAttempts = 0;
            if (!existingError && existing) {
                currentAttempts = existing.attempts || 0;
            }

            // 4. Upsert new data
            const upsertData: any = {
                wallet_address: publicKey.toString(),
                character_id: characterId,
                success: isCorrect,
                attempts: currentAttempts + 1,
                last_attempt: new Date().toISOString(), // always set last_attempt
            };

            const { error: upsertError } = await supabase
                .from('character_challenges')
                .upsert(upsertData, { onConflict: 'wallet_address,character_id' });

            if (upsertError) throw upsertError;

            // 5. Handle local states
            if (!isCorrect) {
                // Wrong answer => set cooldown, clear guess
                setCooldowns((prev) => ({
                    ...prev,
                    [characterId]: new Date(),
                }));
                setGuesses((prev) => ({
                    ...prev,
                    [characterId]: '',
                }));
            } else {
                // Correct answer => remove from cooldown, optimistically mark solved
                setCooldowns((prev) => {
                    const { [characterId]: _, ...rest } = prev;
                    return rest;
                });

                // +++ OPTIMISTIC UPDATE: Mark as solved in local winners
                setWinners((prev) => ({
                    ...prev,
                    [characterId]: publicKey.toString(),
                }));
            }

            // 6. Re-fetch total attempts
            await fetchTotalAttempts();

        } catch (error) {
            console.error('Error submitting guess:', error);
        } finally {
            setIsLoading(false);
            setSubmittingId(null);
        }
    };

    // --- Utility Functions ---

    const formatTimeRemaining = (milliseconds: number) => {
        const minutes = Math.floor(milliseconds / (60 * 1000));
        const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getCooldownRemaining = (characterId: string) => {
        const lastAttempt = cooldowns[characterId];
        if (!lastAttempt) return 0;
        const timePassed = Date.now() - lastAttempt.getTime();
        return Math.max(COOLDOWN_DURATION - timePassed, 0);
    };

    const handleCopy = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopiedStates((prev) => ({ ...prev, [address]: true }));
            setTimeout(() => {
                setCopiedStates((prev) => ({ ...prev, [address]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    // --- Render ---

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Character Challenges
            </h1>

            {/* Token/Holder Stats */}
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

                {/* The Grid of Characters */}
                <div className="challenge-grid">
                    {charactersConfig.map((character) => {
                        const cooldownMs = getCooldownRemaining(character.id);
                        const hasResult = results[character.id] !== undefined;
                        const isCorrect = results[character.id];
                        const isCooldown = cooldownMs > 0;
                        const isSolved = !!winners[character.id];

                        return (
                            <div
                                key={character.id}
                                className={`challenge-card ${isSolved
                                    ? 'solved'
                                    : hasResult
                                        ? (isCorrect ? 'success' : 'error')
                                        : ''
                                    }`}
                            >
                                <div className="header">
                                    <img src={character.avatar} alt={character.name} />
                                    <h3>{character.name}</h3>
                                </div>

                                <div className="content">
                                    <input
                                        type="text"
                                        placeholder={
                                            !connected
                                                ? 'Connect wallet first'
                                                : isSolved
                                                    ? 'Solved'
                                                    : isCooldown
                                                        ? 'Waiting for cooldown...'
                                                        : 'Enter the secret phrase...'
                                        }
                                        value={guesses[character.id] || ''}
                                        onChange={(e) =>
                                            setGuesses({
                                                ...guesses,
                                                [character.id]: e.target.value,
                                            })
                                        }
                                        disabled={isCooldown || !connected || isSolved}
                                    />

                                    <div className="status">
                                        <div className="status-indicator">
                                            <div className="status-icon">
                                                {!connected ? (
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
                                                    : isSolved
                                                        ? 'Solved'
                                                        : hasResult
                                                            ? isCorrect
                                                                ? 'Correct!'
                                                                : 'Wrong answer'
                                                            : isCooldown
                                                                ? 'Cooldown active'
                                                                : 'Ready to guess'}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleGuess(character.id)}
                                            disabled={isCooldown || !connected || isLoading || isSolved}
                                            className={`challenge-button ${isCooldown || isSolved ? 'cooldown' : 'ready'
                                                }`}
                                        >
                                            {!connected ? (
                                                <>
                                                    <Wallet className="w-4 h-4" />
                                                    Connect Wallet
                                                </>
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

            {/* Winner Section */}
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
                                    <span>Winner:</span>
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
