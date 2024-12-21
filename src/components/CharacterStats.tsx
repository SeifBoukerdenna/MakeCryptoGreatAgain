// src/components/CharacterStats.tsx
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
            <div className="token-holder-card mt-8 flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="token-holder-card mt-8">
                <div className="text-red-500 text-center py-8">
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
        <div className="token-holder-card mt-8">
            <div className="holder-stats">
                <div className="stat-item">
                    <div className="stat-label">Total Messages</div>
                    <div className="stat-value">{totalMessages}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Active Characters</div>
                    <div className="stat-value">{characterStats.length}</div>
                </div>
            </div>

            <table className="holders-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Character</th>
                        <th>Messages Sent</th>
                        <th>Last Used</th>
                    </tr>
                </thead>
                <tbody>
                    {characterStats.map((character, index) => (
                        <tr key={character.id}>
                            <td className="rank-cell">
                                <span className={`rank-badge ${index < 3 ? ['gold', 'silver', 'bronze'][index] : ''}`}>
                                    #{index + 1}
                                </span>
                            </td>
                            <td className="address-cell">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={character.avatar}
                                        alt={character.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    {character.name}
                                </div>
                            </td>
                            <td className="mcga-balance">{character.message_count}</td>
                            <td className="text-gray-600 dark:text-gray-400">
                                {formatDistanceToNow(new Date(character.last_used), {
                                    addSuffix: true
                                })}
                            </td>
                        </tr>
                    ))}
                    {characterStats.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-8 text-gray-500">
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