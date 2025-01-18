// src/pages/Challenge.tsx

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
    Lock,
    Unlock,
    RefreshCw,
    Check,
    Timer,
    Wallet,
    Coins,
    ExternalLink,
    InfoIcon,
} from 'lucide-react';
import { charactersConfig } from '../configs/characters.config';
import { formatTimeRemaining } from '../utils/time';
import { truncateAddress } from '../utils/adress';
import { useChallengeLogic } from '../hooks/useChallengeLogic';
import '../styles/challenge.css';
import TruncatedAddressLink from '../components/TruncatedAddressLink';
import { toast } from 'react-toastify';
import ChallengeTour from '../components/tours/ChallengeTour';
import CooldownExplainer from '../components/CooldownExplainer';
import WinnersSection from '../components/WinnersSection';
import { Link } from 'react-router-dom';
import Tooltip from '../components/Tooltip';
import { CHALLENGES_ENABLED } from '../configs/test.config';
import ChallengeBanner from '../components/ChallengeBanner';

const ChallengePage = () => {
    const { connected } = useWallet();
    const { connection } = useConnection();

    const {
        guesses,
        setGuesses,
        characterStatuses,
        isLoading,
        submittingId,
        poolInfos,
        copiedStates,
        handleGuess,
        handleCopy,
        getCooldownRemaining,
        isCoolingDown,
    } = useChallengeLogic(handleTransaction);

    // Fetch pool balances whenever pool info changes
    const [poolBalances, setPoolBalances] = useState<Record<string, number>>({});
    useEffect(() => {
        if (Object.keys(poolInfos).length > 0) {
            fetchPoolBalances();
            const interval = setInterval(fetchPoolBalances, 60000); // Refresh every minute
            return () => clearInterval(interval);
        }
    }, [poolInfos, connection]);

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

    const startCountdownTimer = (characterId: string, endTime: number) => {
        // Get the timer element for this character
        const timerElement = document.querySelector(`[data-timer-id="${characterId}"]`);
        if (!timerElement) return;

        // Clear any existing interval
        const existingInterval = (window as any)[`timerInterval_${characterId}`];
        if (existingInterval) {
            clearInterval(existingInterval);
        }

        const updateTimer = () => {
            const now = Date.now();
            const timeLeft = endTime - now;

            if (timeLeft <= 0) {
                clearInterval((window as any)[`timerInterval_${characterId}`]);
                timerElement.textContent = 'Ready - Refresh the page';
                return;
            }

            // Use the updated formatTimeRemaining function
            timerElement.textContent = formatTimeRemaining(timeLeft);
        };

        // Start interval
        updateTimer(); // Initial update
        (window as any)[`timerInterval_${characterId}`] = setInterval(updateTimer, 1000);
    };


    // Handle transaction notifications
    function handleTransaction(txHash: string) {
        const solscanUrl = `https://solscan.io/tx/${txHash}?cluster=devnet`;

        toast.info(
            <div className="flex flex-col">
                <div className="flex items-center justify-between">
                    <span>Transaction Submitted</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm break-all">{truncateAddress(txHash)}</span>
                    <a
                        href={solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                    >
                        View on Solscan <ExternalLink size={16} />
                    </a>
                </div>
            </div>,
            {
                position: "top-right",
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            }
        );
    }

    if (!CHALLENGES_ENABLED) {
        return <ChallengeBanner />;
    }


    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <ChallengeTour />
            <div className="cooldown-explainer">
                <CooldownExplainer />
            </div>
            <div className='challenge-header'>
                <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Character Challenges
                    </span>
                </h1>
                <Link
                    to="/about"
                    className="text-purple-600 hover:text-pink-600 transition-colors duration-300"
                    title="Learn more about challenges in the About page"
                >
                    <Tooltip message='Learn more about challenges in the About page'>
                        <InfoIcon size={24} />
                    </Tooltip>
                </Link>
            </div>

            {/* Stats Section */}
            <div className="token-holder-card">
                {/* Character Grid */}
                <div className="challenge-grid">
                    {charactersConfig.map((character) => {
                        const characterStatus = characterStatuses[character.id];
                        const cooldownMs = getCooldownRemaining(character.id);
                        const isSolved = characterStatus?.is_solved;
                        const currentlyCoolingDown = isCoolingDown(character.id);
                        const poolBalance = poolBalances[character.id] || 0;
                        const hasPool = !!poolInfos[character.id];

                        return (
                            <div
                                key={character.id}
                                className={`challenge-card ${isSolved ? 'solved' : ''}`}
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
                                                <TruncatedAddressLink
                                                    address={poolInfos[character.id].pool_address}
                                                    className="mt-2"
                                                />
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
                                                        ? `${characterStatus.secret_phrase}`
                                                        : currentlyCoolingDown
                                                            ? 'Waiting for cooldown...'
                                                            : 'Enter the secret phrase...'
                                        }
                                        value={guesses[character.id] || ''}
                                        onChange={(e) => setGuesses({
                                            ...guesses,
                                            [character.id]: e.target.value,
                                        })}
                                        disabled={!hasPool || currentlyCoolingDown || !connected || isSolved}
                                        className={isSolved ? 'solved-input' : ''}
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
                                                ) : currentlyCoolingDown ? (
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
                                                            : currentlyCoolingDown
                                                                ? 'Cooldown active'
                                                                : 'Ready to guess'}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => handleGuess(character.id)}
                                            disabled={!hasPool || currentlyCoolingDown || !connected || isLoading || isSolved}
                                            className={`challenge-button ${currentlyCoolingDown || isSolved ? 'cooldown' : 'ready'}`}
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
                                            ) : currentlyCoolingDown ? (
                                                <>
                                                    <Timer />
                                                    <span
                                                        data-timer-id={character.id}
                                                        ref={(el) => {
                                                            if (el && cooldownMs > 0) {
                                                                startCountdownTimer(character.id, Date.now() + cooldownMs);
                                                            }
                                                        }}
                                                    >
                                                        {formatTimeRemaining(cooldownMs)}
                                                    </span>
                                                </>
                                            ) : (
                                                'Submit'
                                            )}
                                        </button>
                                    </div>

                                    {/* Overlays */}
                                    {currentlyCoolingDown && (
                                        <div className="cooldown-overlay">
                                            <div className="cooldown-timer">
                                                <Timer />
                                                <span
                                                    data-timer-id={`overlay-${character.id}`}
                                                    ref={(el) => {
                                                        if (el && cooldownMs > 0) {
                                                            startCountdownTimer(`overlay-${character.id}`, Date.now() + cooldownMs);
                                                        }
                                                    }}
                                                >
                                                    {formatTimeRemaining(cooldownMs)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {!connected && !currentlyCoolingDown && !isSolved && (
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
            <WinnersSection
                charactersConfig={charactersConfig}
                characterStatuses={characterStatuses}
                copiedStates={copiedStates}
                handleCopy={handleCopy}
            />
        </div>
    );
};

export default ChallengePage;
