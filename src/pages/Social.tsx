import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, ParsedAccountData } from '@solana/web3.js';
import { MCGA_TOKEN_MINT } from '../constants/tokens';
import { formatToK } from '../utils/numberFormat';
import { Copy, Check } from 'lucide-react';
import '../styles/social.css';

interface TokenHolder {
    address: string;
    mcgaBalance: number;
    solBalance: number;
}

interface CopiedState {
    [key: string]: boolean;
}

const Social = () => {
    const { connection } = useConnection();
    const [holders, setHolders] = useState<TokenHolder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<CopiedState>({});
    const TOP_N = 10;

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

    useEffect(() => {
        const fetchLargestHolders = async () => {
            try {
                setIsLoading(true);
                setError(null);
                console.log('Fetching top token holders for mint:', MCGA_TOKEN_MINT.toBase58());

                const largestAccounts = await connection.getTokenLargestAccounts(MCGA_TOKEN_MINT);
                if (!largestAccounts.value || largestAccounts.value.length === 0) {
                    setError('No token holders found');
                    setHolders([]);
                    return;
                }

                const topHolders = largestAccounts.value.slice(0, TOP_N);
                console.log(`Fetching details for top ${topHolders.length} holders`);

                const holdersData = await Promise.all(
                    topHolders.map(async (accountInfo) => {
                        try {
                            const parsedAccountInfo = await connection.getParsedAccountInfo(accountInfo.address);
                            if (!parsedAccountInfo.value) return null;

                            const parsedData = parsedAccountInfo.value.data;
                            if (parsedData && typeof parsedData !== 'string' && 'parsed' in parsedData) {
                                const parsedInfo = (parsedData as ParsedAccountData).parsed.info;
                                const ownerAddress = parsedInfo.owner;
                                const tokenAmount = parsedInfo.tokenAmount?.uiAmount ?? 0;

                                const solBalanceLamports = await connection.getBalance(new PublicKey(ownerAddress));
                                const solBalance = solBalanceLamports / 1e9;

                                return {
                                    address: ownerAddress,
                                    mcgaBalance: tokenAmount,
                                    solBalance,
                                };
                            }
                            return null;
                        } catch (err) {
                            console.error(`Error fetching account info:`, err);
                            return null;
                        }
                    })
                );

                const validHolders = holdersData
                    .filter((holder): holder is TokenHolder => holder !== null)
                    .sort((a, b) => b.mcgaBalance - a.mcgaBalance);

                setHolders(validHolders);
            } catch (err) {
                console.error('Error fetching largest token holders:', err);
                setError('Failed to fetch token holders');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLargestHolders();
        const interval = setInterval(fetchLargestHolders, 60000);
        return () => clearInterval(interval);
    }, [connection]);

    const truncateAddress = (address: string) =>
        `${address.slice(0, 4)}...${address.slice(-4)}`;

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

    const totalMcga = holders.reduce((sum, h) => sum + h.mcgaBalance, 0);

    return (
        <div className="social-container">
            <h1 className="text-3xl font-bold mb-8 text-center">MCGA Community</h1>

            <div className="token-holder-card">
                <div className="holder-stats">
                    <div className="stat-item">
                        <div className="stat-label">Total Holders</div>
                        <div className="stat-value">{holders.length}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">MCGA Token</div>
                        <button
                            onClick={() => handleCopy(MCGA_TOKEN_MINT.toBase58())}
                            className="copy-address-button"
                            title="Click to copy token address"
                        >
                            <span>{truncateAddress(MCGA_TOKEN_MINT.toBase58())}</span>
                            {copiedStates[MCGA_TOKEN_MINT.toBase58()] ? (
                                <Check className="copy-icon" size={16} />
                            ) : (
                                <Copy className="copy-icon" size={16} />
                            )}
                        </button>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Total MCGA</div>
                        <div className="stat-value">{formatToK(totalMcga)}</div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="loading-spinner"></div>
                    </div>
                ) : error ? (
                    <div className="p-8">
                        <div className="error-message">{error}</div>
                    </div>
                ) : (
                    <table className="holders-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Address</th>
                                <th>MCGA Balance</th>
                                <th>SOL Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holders.map((holder, index) => (
                                <tr key={holder.address}>
                                    <td className="rank-cell">
                                        {getRankBadge(index)}
                                    </td>
                                    <td className="address-cell">
                                        <button
                                            onClick={() => handleCopy(holder.address)}
                                            className="copy-address-button"
                                            title="Click to copy address"
                                        >
                                            <span>{truncateAddress(holder.address)}</span>
                                            {copiedStates[holder.address] ? (
                                                <Check className="copy-icon" size={16} />
                                            ) : (
                                                <Copy className="copy-icon" size={16} />
                                            )}
                                        </button>
                                    </td>
                                    <td className="mcga-balance">
                                        {formatToK(holder.mcgaBalance)}
                                    </td>
                                    <td className="sol-balance">
                                        {formatToK(holder.solBalance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Social;