// src/components/CharacterStats.tsx

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CharacterStatsProps {
    characterStats: any[];
    isLoading: boolean;
    error: string | null;
}

interface CopiedState {
    [key: string]: boolean;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({
    characterStats,
    isLoading,
    error
}) => {
    const [copiedStates, setCopiedStates] = useState<CopiedState>({});

    const handleCopy = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopiedStates(prev => ({ ...prev, [address]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [address]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="token-holder-card loading-container">
                <Loader2 className="loading-icon" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="token-holder-card">
                <div className="error-loading-stats">
                    Error loading character stats: {error}
                </div>
            </div>
        );
    }

    const totalMessages = characterStats.reduce(
        (sum, char) => sum + char.message_count,
        0
    );

    return (
        <div className="token-holder-card character-stats-card">
            <h2 className="character-stats-title">
                Character Statistics
            </h2>

            <div className="character-stats-summary">
                <div className="stat-item">
                    <div className="stat-label">Total Messages</div>
                    <div className="stat-value">{totalMessages}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Active Characters</div>
                    <div className="stat-value">{characterStats.length}</div>
                </div>
            </div>

            <table className="character-stats-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Character</th>
                        <th className="stats-center">Messages Sent</th>
                        <th>Last Used</th>
                        <th>Wallet Address</th> {/* New Column */}
                    </tr>
                </thead>
                <tbody>
                    {characterStats.map((character, index) => (
                        <tr key={character.id} className="character-row">
                            <td className="rank-cell">
                                <span
                                    className={`rank-badge ${index < 3
                                        ? ['gold', 'silver', 'bronze'][index]
                                        : ''
                                        }`}
                                >
                                    #{index + 1}
                                </span>
                            </td>
                            <td className="character-cell">
                                <div className="character-content">
                                    <div className="avatar-wrapper">
                                        <img
                                            src={character.avatar}
                                            alt={character.name}
                                            className="avatar"
                                        />
                                    </div>
                                    <span className="character-name">{character.name}</span>
                                </div>
                            </td>
                            <td className="stats-center mcga-balance">
                                {character.message_count}
                            </td>
                            <td className="character-time">
                                {formatDistanceToNow(new Date(character.last_used), {
                                    addSuffix: true
                                })}
                            </td>
                            <td className="wallet-address-cell">
                                <button
                                    onClick={() => handleCopy(character.wallet_address)}
                                    className="copy-address-button"
                                    title="Click to copy wallet address"
                                >
                                    <span>{truncateAddress(character.wallet_address)}</span>
                                    {copiedStates[character.wallet_address] ? (
                                        <Check className="copy-icon" size={16} />
                                    ) : (
                                        <Copy className="copy-icon" size={16} />
                                    )}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {characterStats.length === 0 && (
                        <tr>
                            <td colSpan={5} className="no-data">
                                No character usage data yet
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const truncateAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

export default CharacterStats;
