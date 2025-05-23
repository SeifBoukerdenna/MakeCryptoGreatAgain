// src/components/CharacterStats.tsx

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatToK } from '../utils/numberFormat';
import { truncateAddress } from '../utils/adress';

interface CharacterStatsProps {
    characterStats: AggregatedCharacterStats[];
    isLoading: boolean;
    error: string | null;
}

interface CopiedState {
    [key: string]: boolean;
}

interface AggregatedCharacterStats {
    character_id: string;
    total_message_count: number;
    last_used: string;
    last_wallet_address: string;
    name: string;
    avatar: string;
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
            // console.error('Failed to copy address:', err);
        }
    };

    const getRankBadge = (index: number) => {
        switch (index) {
            case 0:
                return <span className="rank-badge gold">🥇 #1</span>;
            case 1:
                return <span className="rank-badge silver">🥈 #2</span>;
            case 2:
                return <span className="rank-badge bronze">🥉 #3</span>;
            default:
                return `#${index + 1}`;
        }
    };

    // Filter out Trump from total message count
    const totalMessages = characterStats.reduce(
        (sum, char) => char.character_id !== "1" ? sum + char.total_message_count : sum,
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
                    <div className="stat-label">Active Paid Characters</div>
                    <div className="stat-value">{characterStats.filter(char => char.character_id !== "1").length}</div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="loading-spinner"></div>
                </div>
            ) : error ? (
                <div className="p-8">
                    <div className="error-message">Error loading character stats: {error}</div>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="character-stats-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Character</th>
                                <th className="stats-center">Total Messages</th>
                                <th>Last Used</th>
                                <th>Last Wallet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {characterStats.map((character, index) => (
                                <tr
                                    key={character.character_id}
                                    className={`character-row ${character.character_id === "1" ? "free-character" : ""}`}
                                >
                                    <td className="rank-cell">
                                        {character.character_id === "1" ? (
                                            <span className="free-badge">FREE</span>
                                        ) : (
                                            getRankBadge(index)
                                        )}
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
                                    <td className="stats-center mcga-balance" colSpan={character.character_id === "1" ? 3 : 1}>
                                        {character.character_id === "1" ? (
                                            <span className="free-character-note">
                                                Free character - statistics not tracked
                                            </span>
                                        ) : (
                                            formatToK(character.total_message_count)
                                        )}
                                    </td>
                                    {character.character_id !== "1" && (
                                        <>
                                            <td className="character-time">
                                                {formatDistanceToNow(new Date(character.last_used), {
                                                    addSuffix: true
                                                })}
                                            </td>
                                            <td className="wallet-address-cell">
                                                <button
                                                    onClick={() => handleCopy(character.last_wallet_address)}
                                                    className="copy-address-button"
                                                    title="Click to copy wallet address"
                                                >
                                                    <span>{truncateAddress(character.last_wallet_address)}</span>
                                                    {copiedStates[character.last_wallet_address] ? (
                                                        <Check className="copy-icon" size={16} />
                                                    ) : (
                                                        <Copy className="copy-icon" size={16} />
                                                    )}
                                                </button>
                                            </td>
                                        </>
                                    )}
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
            )}
        </div>
    );
};


export default CharacterStats;
