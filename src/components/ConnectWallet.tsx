import React, { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { PhantomWalletName } from '@solana/wallet-adapter-wallets';

// The SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

interface TokenInfo {
    mint: string;
    amount: number;
    decimals: number;
}

const ConnectWallet: React.FC = () => {
    const { connected, publicKey, connect, disconnect, select } = useWallet();
    const { connection } = useConnection();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);

    const handleConnect = useCallback(async () => {
        try {
            select(PhantomWalletName); // Ensure Phantom is selected
            await connect();
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    }, [connect, select]);

    const handleDisconnect = useCallback(async () => {
        try {
            await disconnect();
            setTokens([]);
        } catch (error) {
            console.error("Error disconnecting wallet:", error);
        }
    }, [disconnect]);

    useEffect(() => {
        const fetchTokens = async () => {
            if (connected && publicKey) {
                try {
                    // Get all token accounts owned by the current wallet
                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                        publicKey,
                        { programId: TOKEN_PROGRAM_ID }
                    );

                    const fetchedTokens: TokenInfo[] = [];

                    for (const { account } of tokenAccounts.value) {
                        const data = account.data.parsed.info;
                        const amount = parseInt(data.tokenAmount.amount, 10);
                        const decimals = data.tokenAmount.decimals;
                        const mint = data.mint;

                        // Only consider tokens with a positive balance
                        if (amount > 0) {
                            fetchedTokens.push({
                                mint,
                                amount: amount / Math.pow(10, decimals),
                                decimals
                            });
                        }
                    }

                    setTokens(fetchedTokens);
                } catch (error) {
                    console.error("Error fetching tokens:", error);
                }
            }
        };

        fetchTokens();
    }, [connected, publicKey, connection]);

    const truncatedAddress = publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : '';

    return (
        <div className="connect-wallet">
            {connected && publicKey ? (
                <div className="wallet-connected">
                    <p>Wallet: {truncatedAddress}</p>
                    <button className="wallet-button" onClick={handleDisconnect}>
                        Disconnect
                    </button>

                    {/* Display Tokens */}
                    <div className="token-list" style={{ marginTop: '1rem' }}>
                        <h3>Your Tokens:</h3>
                        {tokens.length === 0 && <p>No tokens found.</p>}
                        {tokens.map((token, i) => (
                            <div key={i} className="token-item" style={{ marginBottom: '0.5rem' }}>
                                <p><strong>Mint:</strong> {token.mint}</p>
                                <p><strong>Balance:</strong> {token.amount.toLocaleString()} (Decimals: {token.decimals})</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <button className="wallet-button" onClick={handleConnect}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
};

export default ConnectWallet;
