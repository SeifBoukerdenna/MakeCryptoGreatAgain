// src/pages/Challenge.tsx
import { useWallet } from '@solana/wallet-adapter-react';
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
import { useChallengeLogic } from '../hooks/useChallengeLogic';
import { formatTimeRemaining } from '../utils/time';


const ChallengePage = () => {
    const { connected, } = useWallet();


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
