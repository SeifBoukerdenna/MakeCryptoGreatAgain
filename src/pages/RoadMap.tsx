import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import { Loader2, ThumbsUp, Timer, Users, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import '../styles/roadmap.css';

interface Character {
    id: string;
    name: string;
    description: string;
    votes: number;
    percentage?: number;
}

// Vibrant color palette for the pie chart
const COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#F43F5E'];

const RoadmapPage = () => {
    const { connected, publicKey } = useWallet();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userVote, setUserVote] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [totalVotes, setTotalVotes] = useState(0);

    const calculateTimeLeft = (endTime: Date) => {
        const now = new Date();
        const difference = endTime.getTime() - now.getTime();

        if (difference <= 0) return '00:00:00';

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const fetchCharacters = async () => {
        try {
            setIsLoading(true);
            const { data: charactersData, error: charactersError } = await supabase
                .from('proposed_characters')
                .select('*')
                .order('votes', { ascending: false });

            if (charactersError) throw charactersError;

            if (connected && publicKey) {
                const { data: voteData } = await supabase
                    .from('character_votes')
                    .select('character_id')
                    .eq('wallet_address', publicKey.toString())
                    .single();

                if (voteData) {
                    setUserVote(voteData.character_id);
                }
            }

            // Calculate total votes and percentages
            const total = charactersData?.reduce((sum, char) => sum + char.votes, 0) || 0;
            setTotalVotes(total);

            const processedData = charactersData?.map(char => ({
                ...char,
                percentage: total > 0 ? (char.votes / total) * 100 : 0
            })) || [];

            setCharacters(processedData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load characters');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();

        // Set up real-time subscription for vote updates
        const subscription = supabase
            .channel('character_votes_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'character_votes' },
                fetchCharacters)
            .subscribe();

        // Set up voting period timer
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 24);

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(endTime));
        }, 1000);

        return () => {
            subscription.unsubscribe();
            clearInterval(timer);
        };
    }, [connected, publicKey]);

    const handleVote = async (characterId: string) => {
        if (!connected || !publicKey) {
            setError('Please connect your wallet to vote');
            return;
        }

        if (userVote) {
            setError('You have already voted');
            return;
        }

        try {
            setIsLoading(true);

            const { error: voteError } = await supabase
                .from('character_votes')
                .insert({
                    wallet_address: publicKey.toString(),
                    character_id: characterId,
                });

            if (voteError) throw voteError;

            const { error: updateError } = await supabase.rpc('increment_character_votes', {
                char_id: characterId,
            });

            if (updateError) throw updateError;

            setUserVote(characterId);
            await fetchCharacters();
        } catch (err) {
            console.error('Error voting:', err);
            setError('Failed to submit vote');
        } finally {
            setIsLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="text-base font-semibold">{data.name}</p>
                    <p className="text-sm">{`${data.value} votes (${data.percent.toFixed(1)}%)`}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    const chartData = characters.map(char => ({
        name: char.name,
        value: char.votes,
        percent: char.percentage || 0
    }));

    return (
        <div className="roadmap-container">
            <div className="max-w-7xl mx-auto">
                <div className="roadmap-header">
                    <h1 className="roadmap-title">Character Roadmap</h1>
                    <p className="roadmap-description">Vote for the next character to be added</p>

                    <div className="stats-container">
                        <div className="stat-card">
                            <Timer className="stat-icon" />
                            <div className="stat-content">
                                <div className="stat-label">Time Left</div>
                                <div className="timer-display">{timeLeft}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <Users className="stat-icon" />
                            <div className="stat-content">
                                <div className="stat-label">Total Votes</div>
                                <div className="stat-value">{totalVotes}</div>
                            </div>
                        </div>
                    </div>

                    {!connected && (
                        <div className="connect-prompt">
                            Connect your wallet to vote
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                <div className="voting-content">
                    {/* Pie Chart Section */}
                    <div className="chart-section">
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="rgba(255,255,255,0.2)"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Voting Cards Section */}
                    <div className="voting-cards">
                        {characters.map((character, index) => (
                            <div
                                key={character.id}
                                className={`vote-card ${userVote === character.id ? 'voted' : ''}`}
                            >
                                <div className="vote-card-content">
                                    <div className="vote-card-header">
                                        <div className="rank-badge" style={{
                                            background: COLORS[index % COLORS.length]
                                        }}>
                                            #{index + 1}
                                        </div>
                                        <h3 className="vote-card-title">{character.name}</h3>
                                        <span className="vote-count">
                                            {character.votes} votes
                                        </span>
                                    </div>

                                    <p className="vote-card-description">
                                        {character.description}
                                    </p>

                                    <div className="vote-progress-bar">
                                        <div
                                            className="vote-progress"
                                            style={{
                                                width: `${character.percentage}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        />
                                    </div>

                                    <div className="vote-percentage">
                                        {character.percentage?.toFixed(1)}%
                                    </div>

                                    <button
                                        onClick={() => handleVote(character.id)}
                                        disabled={!connected || !!userVote}
                                        className={`vote-button ${userVote === character.id ? 'voted' : ''}`}
                                        style={{
                                            backgroundColor: userVote === character.id
                                                ? '#10B981'
                                                : COLORS[index % COLORS.length]
                                        }}
                                    >
                                        {userVote === character.id ? (
                                            <>
                                                <ThumbsUp className="w-5 h-5" />
                                                Voted
                                            </>
                                        ) : userVote ? (
                                            'Already Voted'
                                        ) : !connected ? (
                                            'Connect Wallet'
                                        ) : (
                                            <>
                                                Vote Now
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoadmapPage;