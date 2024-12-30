import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { MCGA_TOKEN_MINT } from '../constants/tokens';
import { supabase } from '../lib/supabase';
import { Copy, Check } from 'lucide-react';
import { formatToK } from '../utils/numberFormat';
import { formatDistanceToNow } from 'date-fns';

interface UserEngagement {
    wallet_address: string;
    total_interactions: number;
    mcga_balance: number;
    last_interaction: string;
}

const EngagementLeaderboard = () => {
    const { connection } = useConnection();
    const [users, setUsers] = useState<UserEngagement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

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

    const fetchMcgaBalance = async (address: string, retries = 3, delay = 1000): Promise<number> => {
        try {
            const pubKey = new PublicKey(address);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                pubKey,
                { mint: MCGA_TOKEN_MINT }
            );

            const mcgaAccount = tokenAccounts.value[0];
            if (mcgaAccount) {
                const tokenAmount = mcgaAccount.account.data.parsed.info.tokenAmount;
                return parseInt(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
            }
            return 0;
        } catch (err: any) {
            if (err.response?.status === 429 && retries > 0) {
                console.warn(`Rate limited. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                return fetchMcgaBalance(address, retries - 1, delay * 2);
            } else {
                console.error('Error fetching MCGA balance:', err);
                return 0;
            }
        }
    };

    useEffect(() => {
        const fetchUserEngagement = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch interaction data from Supabase
                const { data, error: fetchError } = await supabase
                    .from('message_stats')
                    .select('wallet_address, message_count, last_used')
                    .order('message_count', { ascending: false });

                if (fetchError) throw fetchError;

                // Aggregate data by wallet
                const aggregatedData = data.reduce((acc: Record<string, UserEngagement>, curr) => {
                    if (!acc[curr.wallet_address]) {
                        acc[curr.wallet_address] = {
                            wallet_address: curr.wallet_address,
                            total_interactions: 0,
                            mcga_balance: 0,
                            last_interaction: curr.last_used
                        };
                    }
                    acc[curr.wallet_address].total_interactions += curr.message_count;
                    if (new Date(curr.last_used) > new Date(acc[curr.wallet_address].last_interaction)) {
                        acc[curr.wallet_address].last_interaction = curr.last_used;
                    }
                    return acc;
                }, {});

                const userAddresses = Object.keys(aggregatedData);

                // Limit concurrent requests to avoid rate limiting
                const BATCH_SIZE = 5; // Adjust based on API limits
                for (let i = 0; i < userAddresses.length; i += BATCH_SIZE) {
                    const batch = userAddresses.slice(i, i + BATCH_SIZE);
                    const balances = await Promise.all(
                        batch.map(address => fetchMcgaBalance(address))
                    );
                    batch.forEach((address, index) => {
                        aggregatedData[address].mcga_balance = balances[index];
                    });
                }

                // Convert aggregated data to array and sort
                const usersWithBalances = Object.values(aggregatedData).sort(
                    (a, b) => b.total_interactions - a.total_interactions
                );

                setUsers(usersWithBalances);
            } catch (err) {
                console.error('Error fetching user engagement:', err);
                setError('Failed to fetch user engagement data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserEngagement();
        const interval = setInterval(fetchUserEngagement, 10000); // Fetch every 10 seconds
        return () => clearInterval(interval);
    }, [connection]);

    const truncateAddress = (address: string) =>
        `${address.slice(0, 4)}...${address.slice(-4)}`;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="token-holder-card">
            <h2 className="text-2xl font-bold mb-4 p-4">Top Active Users</h2>
            <div className="table-responsive">
                <table className="holders-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Wallet</th>
                            <th>Total Interactions</th>
                            {/* <th>MCGA Balance</th> */}
                            <th>Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user.wallet_address}>
                                <td className="rank-cell">
                                    {index === 0 ? (
                                        <span className="rank-badge gold">🥇 #1</span>
                                    ) : index === 1 ? (
                                        <span className="rank-badge silver">🥈 #2</span>
                                    ) : index === 2 ? (
                                        <span className="rank-badge bronze">🥉 #3</span>
                                    ) : (
                                        `#${index + 1}`
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleCopy(user.wallet_address)}
                                        className="copy-address-button"
                                        title="Click to copy address"
                                    >
                                        <span>{truncateAddress(user.wallet_address)}</span>
                                        {copiedStates[user.wallet_address] ? (
                                            <Check className="copy-icon" size={16} />
                                        ) : (
                                            <Copy className="copy-icon" size={16} />
                                        )}
                                    </button>
                                </td>
                                <td className="text-center font-semibold">
                                    {formatToK(user.total_interactions)}
                                </td>
                                {/* <td className="mcga-balance">
                                    {formatToK(user.mcga_balance)}
                                </td> */}
                                <td className="text-sm text-gray-500">
                                    {formatDistanceToNow(new Date(user.last_interaction), { addSuffix: true })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EngagementLeaderboard;
