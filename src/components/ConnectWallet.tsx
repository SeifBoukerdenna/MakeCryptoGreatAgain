import React from 'react';

interface ConnectWalletProps {
    walletAddress: string | null;
    setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ walletAddress, setWalletAddress }) => {
    const connect = () => {
        // Simulate a wallet address
        setWalletAddress('SOLANA_WALLET_ADDRESS_EXAMPLE');
    };

    const disconnect = () => {
        setWalletAddress(null);
    };

    return (
        <div className="connect-wallet">
            {walletAddress ? (
                <button className="wallet-button" onClick={disconnect}>
                    Disconnect
                </button>
            ) : (
                <button className="wallet-button" onClick={connect}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
};

export default ConnectWallet;
