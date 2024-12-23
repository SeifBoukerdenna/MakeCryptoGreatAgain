// src/pages/Challenge.tsx
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import { Lock, Unlock, RefreshCw, Check, X, Timer, Wallet } from 'lucide-react';
import { charactersConfig } from '../configs/characters.config';
import '../styles/challenge.css';

// Adjusted cooldown duration for testing (e.g., 6 seconds). Change to 5 * 60 * 1000 for 5 minutes.
const COOLDOWN_DURATION = 0.1 * 60 * 1000; // 6 seconds in milliseconds

const ChallengePage = () => {
    const { connected, publicKey } = useWallet();
    const [guesses, setGuesses] = useState<Record<string, string>>({});
    const [cooldowns, setCooldowns] = useState<Record<string, Date>>({});
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [totalAttempts, setTotalAttempts] = useState<number>(0); // NEW
    const [, forceUpdate] = useState({});

    // Update timer every second to refresh cooldowns
    useEffect(() => {
        const timer = setInterval(() => {
            forceUpdate({});
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Clean up expired cooldowns and clear results for expired cooldowns
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

    // Fetch cooldowns when wallet is connected or disconnected
    useEffect(() => {
        if (publicKey) {
            fetchUserCooldowns();
        } else {
            setCooldowns({});
        }
    }, [publicKey]);

    // Fetch total attempts on page load and whenever there's a guess submission
    useEffect(() => {
        fetchTotalAttempts();
    }, []);

    // Function to fetch user's cooldowns
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
            data.forEach((record) => {
                if (record.last_attempt) {
                    const attemptDate = new Date(record.last_attempt);
                    newCooldowns[record.character_id] = attemptDate;
                }
            });
            setCooldowns(newCooldowns);
        }
    };

    // NEW: Function to fetch the total number of attempts (across all users/characters)
    const fetchTotalAttempts = async () => {
        const { data, error } = await supabase.from('character_challenges').select('attempts');

        if (error) {
            console.error('Error fetching total attempts:', error);
            return;
        }

        if (data && Array.isArray(data)) {
            // Sum up all attempts from each row
            const total = data.reduce((acc, row) => acc + (row.attempts || 0), 0);
            setTotalAttempts(total);
        }
    };

    // Function to handle guess submissions
    const handleGuess = async (characterId: string) => {
        if (!publicKey || !connected) return;

        // If user is on cooldown, don't allow guess
        const lastAttempt = cooldowns[characterId];
        if (lastAttempt && Date.now() - lastAttempt.getTime() < COOLDOWN_DURATION) {
            return;
        }

        setIsLoading(true);
        setSubmittingId(characterId);

        try {
            const { data: secretData, error } = await supabase
                .from('character_secrets')
                .select('secret')
                .eq('character_id', characterId)
                .single();

            if (error) {
                throw error;
            }

            if (secretData) {
                const isCorrect =
                    guesses[characterId]?.toLowerCase() === secretData.secret.toLowerCase();
                setResults((prev) => ({ ...prev, [characterId]: isCorrect }));

                // Fetch the existing row to increment attempts
                const { data: existing, error: existingError } = await supabase
                    .from('character_challenges')
                    .select('*')
                    .eq('wallet_address', publicKey.toString())
                    .eq('character_id', characterId)
                    .single();

                // We'll increment existing attempts by 1 or set it to 1 if there's no row
                let currentAttempts = 0;
                if (!existingError && existing) {
                    currentAttempts = existing.attempts || 0;
                }

                const upsertData: any = {
                    wallet_address: publicKey.toString(),
                    character_id: characterId,
                    success: isCorrect,
                    attempts: currentAttempts + 1,
                };

                if (!isCorrect) {
                    // Set the cooldown only on incorrect guesses
                    upsertData.last_attempt = new Date().toISOString();
                } else {
                    // If correct, remove the cooldown (set last_attempt to null)
                    upsertData.last_attempt = null;
                }

                // Upsert the updated attempts or cooldown
                const { error: upsertError } = await supabase
                    .from('character_challenges')
                    .upsert(upsertData, { onConflict: 'wallet_address,character_id' });

                if (upsertError) {
                    throw upsertError;
                }

                // Update local cooldowns state if guess was wrong
                if (!isCorrect) {
                    const newDate = new Date();
                    setCooldowns((prev) => ({
                        ...prev,
                        [characterId]: newDate,
                    }));

                    // Clear guess if incorrect
                    setGuesses((prev) => ({
                        ...prev,
                        [characterId]: '',
                    }));
                } else {
                    // Remove from cooldowns if correct
                    setCooldowns((prev) => {
                        const { [characterId]: _, ...rest } = prev;
                        return rest;
                    });
                }

                // Finally, re-fetch the total attempts
                await fetchTotalAttempts();
            }
        } catch (error) {
            console.error('Error submitting guess:', error);
        } finally {
            setIsLoading(false);
            setSubmittingId(null);
        }
    };

    // Helper to format cooldown time
    const formatTimeRemaining = (milliseconds: number) => {
        const minutes = Math.floor(milliseconds / (60 * 1000));
        const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate remaining cooldown time
    const getCooldownRemaining = (characterId: string) => {
        const lastAttempt = cooldowns[characterId];
        if (!lastAttempt) return 0;

        const timePassed = Date.now() - lastAttempt.getTime();
        return Math.max(COOLDOWN_DURATION - timePassed, 0);
    };

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

                    {/* NEW: Display total attempts here */}
                    <div className="stat-item">
                        <div className="stat-label">Total Attempts</div>
                        <div className="stat-value">{totalAttempts}</div>
                    </div>
                </div>

                <div className="challenge-grid">
                    {charactersConfig.map((character) => {
                        const cooldownMs = getCooldownRemaining(character.id);
                        const hasResult = results[character.id] !== undefined;
                        const isCorrect = results[character.id];
                        const isCooldown = cooldownMs > 0;

                        return (
                            <div
                                key={character.id}
                                className={`challenge-card ${hasResult ? (isCorrect ? 'success' : 'error') : ''
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
                                        disabled={isCooldown || !connected}
                                    />

                                    <div className="status">
                                        <div className="status-indicator">
                                            {!connected ? (
                                                <>
                                                    <Lock />
                                                    <span>Wallet not connected</span>
                                                </>
                                            ) : hasResult ? (
                                                isCorrect ? (
                                                    <>
                                                        <Check />
                                                        <span>Correct!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <X />
                                                        <span>Wrong answer</span>
                                                    </>
                                                )
                                            ) : isCooldown ? (
                                                <>
                                                    <Lock />
                                                    <span>Cooldown active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock />
                                                    <span>Ready to guess</span>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleGuess(character.id)}
                                            disabled={isCooldown || !connected || isLoading}
                                            className={`challenge-button ${isCooldown ? 'cooldown' : 'ready'
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

                                    {isCooldown && (
                                        <div className="cooldown-overlay">
                                            <div className="cooldown-timer">
                                                <Timer />
                                                Next attempt in {formatTimeRemaining(cooldownMs)}
                                            </div>
                                        </div>
                                    )}

                                    {!connected && !isCooldown && (
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
        </div>
    );
};

export default ChallengePage;
