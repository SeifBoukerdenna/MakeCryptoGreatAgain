// src/components/BuyTrumpTalkCoin.tsx
import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface TokenInfo {
    mint: string;
    amount: number;
    decimals: number;
}

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const BuyTrumpTalkCoin: React.FC = () => {
    const { connected, publicKey } = useWallet();
    const { connection } = useConnection();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [solBalance, setSolBalance] = useState<number>(0);

    useEffect(() => {
        const fetchTokensAndBalance = async () => {
            if (connected && publicKey) {
                try {
                    // Fetch SOL balance
                    const balance = await connection.getBalance(publicKey);
                    setSolBalance(balance / 1e9); // Convert lamports to SOL

                    // Fetch SPL tokens
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
                    // console.error("Error fetching tokens or balance:", error);
                }
            }
        };

        fetchTokensAndBalance();
    }, [connected, publicKey, connection]);

    return (
        <div className="buy-coin-card">
            <h2>Buy TrumpTalk Coin</h2>
            {connected && publicKey ? (
                <div>
                    <p>SOL Balance: {solBalance} SOL</p>
                    <div className="token-list">
                        <h3>Your Tokens:</h3>
                        {tokens.length === 0 && <p>No tokens found.</p>}
                        {tokens.map((token, i) => (
                            <div key={i} className="token-item">
                                <p><strong>Mint:</strong> {token.mint}</p>
                                <p><strong>Balance:</strong> {token.amount.toLocaleString()} (Decimals: {token.decimals})</p>
                            </div>
                        ))}
                    </div>
                    {/* Implement Buy functionality here */}
                </div>
            ) : (
                <p>Please connect your wallet to see your balance.</p>
            )}
        </div>
    );
};

export default BuyTrumpTalkCoin;
