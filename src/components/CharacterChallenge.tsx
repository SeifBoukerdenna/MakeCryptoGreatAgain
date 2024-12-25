import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import { Lock, Unlock, RefreshCw, Check, X, Timer } from 'lucide-react';
import { charactersConfig } from '../configs/characters.config';
import '../styles/character-challenge.css';

const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const CharacterChallenge = () => {
    const { connected, publicKey } = useWallet();
    const [guesses, setGuesses] = useState<Record<string, string>>({});
    const [cooldowns, setCooldowns] = useState<Record<string, Date>>({});
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [, forceUpdate] = useState({});

    // Update timer every second
    useEffect(() => {
        const timer = setInterval(() => {
            forceUpdate({});
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (connected && publicKey) {
            fetchUserCooldowns();
        }
    }, [connected, publicKey]);

    const fetchUserCooldowns = async () => {
        if (!publicKey) return;

        const { data } = await supabase
            .from('character_challenges')
            .select('character_id, last_attempt')
            .eq('wallet_address', publicKey.toString());

        if (data) {
            const newCooldowns: Record<string, Date> = {};
            data.forEach(record => {
                newCooldowns[record.character_id] = new Date(record.last_attempt);
            });
            setCooldowns(newCooldowns);
        }
    };

    const handleGuess = async (characterId: string) => {
        if (!publicKey || !connected) return;

        const lastAttempt = cooldowns[characterId];
        if (lastAttempt && new Date().getTime() - new Date(lastAttempt).getTime() < COOLDOWN_DURATION) {
            return;
        }

        setIsLoading(true);
        setSubmittingId(characterId);
        try {
            const { data: secretData } = await supabase
                .from('character_secrets')
                .select('secret')
                .eq('character_id', characterId)
                .single();

            if (secretData) {
                const isCorrect = guesses[characterId]?.toLowerCase() === secretData.secret.toLowerCase();
                setResults({ ...results, [characterId]: isCorrect });

                await supabase.from('character_challenges').upsert({
                    wallet_address: publicKey.toString(),
                    character_id: characterId,
                    last_attempt: new Date().toISOString(),
                    success: isCorrect
                });

                setCooldowns({
                    ...cooldowns,
                    [characterId]: new Date()
                });

                // Clear guess if incorrect
                if (!isCorrect) {
                    setGuesses(prev => ({
                        ...prev,
                        [characterId]: ''
                    }));
                }
            }
        } catch (error) {
            console.error('Error submitting guess:', error);
        } finally {
            setIsLoading(false);
            setSubmittingId(null);
        }
    };

    const formatTimeRemaining = (milliseconds: number) => {
        const minutes = Math.floor(milliseconds / (60 * 1000));
        const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getCooldownRemaining = (characterId: string) => {
        const lastAttempt = cooldowns[characterId];
        if (!lastAttempt) return 0;

        const timePassed = new Date().getTime() - new Date(lastAttempt).getTime();
        return Math.max(COOLDOWN_DURATION - timePassed, 0);
    };

    return (
        <div className="character-challenges">
            <div className="token-holder-card">
                <h2>Character Challenges</h2>

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
                                            isCooldown
                                                ? 'Waiting for cooldown...'
                                                : 'Enter the secret phrase...'
                                        }
                                        value={guesses[character.id] || ''}
                                        onChange={(e) => setGuesses({
                                            ...guesses,
                                            [character.id]: e.target.value
                                        })}
                                        disabled={isCooldown || !connected}
                                    />

                                    <div className="status">
                                        <div className="status-indicator">
                                            {hasResult ? (
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
                                            {submittingId === character.id ? (
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CharacterChallenge;