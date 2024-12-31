import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import { Loader2, ThumbsUp, Timer, Users, ChevronRight, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MCGA_TOKEN_MINT } from '../constants/tokens';
import { PublicKey } from '@solana/web3.js';
import '../styles/roadmap.css';
import RoadmapTour from '../components/tours/RoadmapTour';

interface Character {
    id: string;
    name: string;
    description: string;
    votes: number;
    percentage?: number;
}

interface VotingPeriod {
    id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface VoteInfo {
    characterId: string;
    weight: number;
}

// Vibrant color palette for the pie chart
const COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#F43F5E'];

const RoadmapPage = () => {
    const { connected, publicKey } = useWallet();
    const { connection } = useConnection();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [voteInfo, setVoteInfo] = useState<VoteInfo | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [votingPeriod, setVotingPeriod] = useState<VotingPeriod | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mcgaBalance, setMcgaBalance] = useState<number>(0);
    const [totalVotes, setTotalVotes] = useState(0);
    const [isVotingEnded, setIsVotingEnded] = useState(false);

    // Enhanced timer effect
    useEffect(() => {
        if (votingPeriod) {
            const updateTimer = () => {
                const now = new Date().getTime();
                const end = new Date(votingPeriod.end_date).getTime();
                const difference = end - now;

                if (difference <= 0) {
                    setIsVotingEnded(true);
                    setTimeLeft('Voting Ended');
                    return;
                }

                // Calculate with millisecond precision
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                const milliseconds = difference % 1000;

                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                } else if (minutes > 0) {
                    setTimeLeft(`${minutes}m ${seconds}s`);
                } else {
                    setTimeLeft(`${seconds}s`);
                }

                // Calculate time until next second
                return 1000 - milliseconds;
            };

            // Set up interval with dynamic timing
            const timer = setInterval(() => {
                const nextTick = updateTimer();
                if (nextTick !== 1000) {
                    clearInterval(timer);
                    setTimeout(() => {
                        // Reset to normal 1-second interval after synchronizing
                        setInterval(updateTimer, 1000);
                    }, nextTick);
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [votingPeriod]);

    const fetchMcgaBalance = async (publicKey: PublicKey) => {
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { mint: MCGA_TOKEN_MINT }
            );

            const mcgaAccount = tokenAccounts.value[0];
            if (mcgaAccount) {
                const tokenAmount = mcgaAccount.account.data.parsed.info.tokenAmount;
                return parseInt(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
            }
            return 0;
        } catch (err) {
            console.error('Error fetching MCGA balance:', err);
            return 0;
        }
    };

    const calculateVoteWeight = (mcgaBalance: number) => {
        // Each 1000 MCGA gives 1 extra vote weight, max 100 weight at 100k MCGA
        return Math.min(Math.floor(mcgaBalance / 1000) + 1, 100);
    };

    const fetchCharacters = async () => {
        try {
            setIsLoading(true);

            // Fetch current voting period
            const { data: periodData, error: periodError } = await supabase
                .from('voting_periods')
                .select('*')
                .eq('is_active', true)
                .single();

            if (!periodError && periodData) {
                setVotingPeriod(periodData);
            }

            // Fetch characters and votes
            const { data: charactersData, error: charactersError } = await supabase
                .from('proposed_characters')
                .select('*')
                .order('votes', { ascending: false });

            if (charactersError) throw charactersError;

            const total = charactersData?.reduce((sum, char) => sum + char.votes, 0) || 0;
            setTotalVotes(total);

            const processedData = charactersData?.map(char => ({
                ...char,
                percentage: total > 0 ? (char.votes / total) * 100 : 0
            })) || [];

            setCharacters(processedData);

            // Fetch current vote if connected
            if (connected && publicKey) {
                const { data: voteData } = await supabase
                    .from('character_votes')
                    .select('character_id, vote_weight')
                    .eq('wallet_address', publicKey.toString())
                    .single();

                if (voteData) {
                    setVoteInfo({
                        characterId: voteData.character_id,
                        weight: voteData.vote_weight
                    });
                }
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (connected && publicKey) {
                const balance = await fetchMcgaBalance(publicKey);
                setMcgaBalance(balance);
            } else {
                setMcgaBalance(0);
                setVoteInfo(null);
            }
        };

        fetchData();
        fetchCharacters();

        // Set up real-time subscriptions
        const subscription = supabase
            .channel('roadmap_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'character_votes' },
                fetchCharacters
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'voting_periods' },
                fetchCharacters
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [connected, publicKey]);

    const handleVote = async (characterId: string) => {
        if (!connected || !publicKey) {
            setError('Please connect your wallet to vote');
            return;
        }

        if (isVotingEnded) {
            setError('Voting period has ended');
            return;
        }

        try {
            setIsLoading(true);
            const voteWeight = calculateVoteWeight(mcgaBalance);

            if (voteInfo) {
                // Remove previous vote
                await supabase.rpc('increment_character_votes', {
                    char_id: voteInfo.characterId,
                    weight: -voteInfo.weight
                });

                // Delete previous vote record
                await supabase
                    .from('character_votes')
                    .delete()
                    .eq('wallet_address', publicKey.toString());
            }

            // Add new vote
            const { error: voteError } = await supabase
                .from('character_votes')
                .insert({
                    wallet_address: publicKey.toString(),
                    character_id: characterId,
                    vote_weight: voteWeight
                });

            if (voteError) throw voteError;

            // Update character votes count
            const { error: updateError } = await supabase.rpc('increment_character_votes', {
                char_id: characterId,
                weight: voteWeight
            });

            if (updateError) throw updateError;

            setVoteInfo({
                characterId,
                weight: voteWeight
            });

            await fetchCharacters();
        } catch (err) {
            console.error('Error voting:', err);
            setError('Failed to submit vote');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelVote = async () => {
        if (!voteInfo || !publicKey || isVotingEnded) return;

        try {
            setIsLoading(true);

            // Remove the vote count
            await supabase.rpc('increment_character_votes', {
                char_id: voteInfo.characterId,
                weight: -voteInfo.weight
            });

            // Delete vote record
            await supabase
                .from('character_votes')
                .delete()
                .eq('wallet_address', publicKey.toString());

            setVoteInfo(null);
            await fetchCharacters();
        } catch (err) {
            console.error('Error canceling vote:', err);
            setError('Failed to cancel vote');
        } finally {
            setIsLoading(false);
        }
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
            <RoadmapTour />
            <div className="max-w-7xl mx-auto">
                <div className="roadmap-header">
                    <h1 className="roadmap-title">Character Roadmap</h1>
                    <p className="roadmap-description">Vote for the next character to be added</p>

                    <div className="stats-container">
                        <div className="stat-card">
                            <Timer className="stat-icon" />
                            <div className="stat-content">
                                <div className="stat-label">
                                    {isVotingEnded ? 'Voting Ended' : 'Time Left'}
                                </div>
                                <div className="timer-display">
                                    {timeLeft}
                                </div>
                                {votingPeriod && (
                                    <div className="deadline-date">
                                        Ends: {new Date(votingPeriod.end_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="stat-card">
                            <Users className="stat-icon" />
                            <div className="stat-content">
                                <div className="stat-label">Total Votes</div>
                                <div className="stat-value">{totalVotes}</div>
                            </div>
                        </div>

                        <div className="stat-card voting-power" data-power={calculateVoteWeight(mcgaBalance)}>
                            <Wallet className="stat-icon" />
                            <div className="stat-content">
                                <div className="stat-label">Your Voting Power</div>
                                <div className="stat-value">
                                    {connected ? `${calculateVoteWeight(mcgaBalance)}x` : '0x'}
                                </div>
                                <div className="power-info">
                                    Based on {mcgaBalance.toLocaleString()} MCGA
                                </div>
                                <div className="power-progress">
                                    <div
                                        className="power-bar"
                                        style={{
                                            width: `${Math.min((mcgaBalance / 100000) * 100, 100)}%`
                                        }}
                                    />
                                </div>
                                <div className="power-tips">
                                    Hold up to 100k MCGA for 100x voting power
                                </div>
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
                                    {chartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="rgba(255,255,255,0.2)"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="voting-cards">
                        {characters.map((character, index) => (
                            <div
                                key={character.id}
                                className={`vote-card ${voteInfo?.characterId === character.id ? 'voted' : ''}`}
                            >
                                <div className="vote-card-content">
                                    <div className="vote-card-header">
                                        <div
                                            className="rank-badge"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        >
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
                                        onClick={() => voteInfo?.characterId === character.id ?
                                            handleCancelVote() : handleVote(character.id)}
                                        disabled={!connected || (isVotingEnded && !voteInfo)}
                                        className={`vote-button ${voteInfo?.characterId === character.id ? 'voted' : ''}
                                            ${isVotingEnded ? 'voting-ended' : ''}`}
                                        style={{
                                            backgroundColor: voteInfo?.characterId === character.id
                                                ? '#10B981'
                                                : COLORS[index % COLORS.length]
                                        }}
                                    >
                                        {voteInfo?.characterId === character.id ? (
                                            <>
                                                <ThumbsUp className="w-5 h-5" />
                                                Click to Cancel Vote ({voteInfo.weight}x)
                                            </>
                                        ) : voteInfo ? (
                                            <>
                                                Change Vote ({calculateVoteWeight(mcgaBalance)}x)
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        ) : isVotingEnded ? (
                                            'Voting Ended'
                                        ) : !connected ? (
                                            'Connect Wallet'
                                        ) : (
                                            <>
                                                Vote Now ({calculateVoteWeight(mcgaBalance)}x)
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