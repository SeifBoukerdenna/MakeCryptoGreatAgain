// src/components/ConnectWallet.tsx

import React, { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PhantomWalletName } from '@solana/wallet-adapter-wallets';
import { Wallet } from 'lucide-react';
import '../styles/ConnectWallet.css';

const ConnectWallet: React.FC = () => {
    const { connected, publicKey, connect, disconnect, select } = useWallet();

    const handleConnect = useCallback(async () => {
        try {
            select(PhantomWalletName);
            await connect();
        } catch (error) {
            // console.error("Error connecting wallet:", error);
        }
    }, [connect, select]);

    const handleDisconnect = useCallback(async () => {
        try {
            await disconnect();
        } catch (error) {
            // console.error("Error disconnecting wallet:", error);
        }
    }, [disconnect]);

    const truncatedAddress = publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : '';

    return (
        <>
            {connected && publicKey ? (
                <div className="balance-item wallet tooltip-container">
                    <Wallet
                        className="wallet-icon h-5 w-5 text-yellow-400"
                        onClick={handleDisconnect}
                    />
                    <span className="balance-amount text-yellow-200">
                        {truncatedAddress}
                    </span>
                    <span className="tooltiptext">Disconnect Wallet</span>
                </div>
            ) : (
                <div className="balance-item wallet tooltip-container">
                    <Wallet
                        className="wallet-icon h-5 w-5 text-yellow-400"
                        onClick={handleConnect}
                    />
                    <span className="tooltiptext">Connect Wallet</span>
                </div>
            )}
        </>
    );
};

export default ConnectWallet;