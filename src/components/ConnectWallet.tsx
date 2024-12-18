import React, { useCallback, useEffect } from 'react';
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
