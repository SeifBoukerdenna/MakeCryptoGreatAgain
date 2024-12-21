import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface CharacterStatsProps {
    characterStats: any[];
    isLoading: boolean;
    error: string | null;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({
    characterStats,
    isLoading,
    error
}) => {
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
                        </tr>
                    ))}
                    {characterStats.length === 0 && (
                        <tr>
                            <td colSpan={4} className="no-data">
                                No character usage data yet
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CharacterStats;
