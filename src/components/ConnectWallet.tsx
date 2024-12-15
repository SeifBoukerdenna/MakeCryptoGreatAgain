import { useWallet } from '@solana/wallet-adapter-react';
import { PhantomWalletName } from '@solana/wallet-adapter-phantom';
import { useCallback } from 'react';

const ConnectWallet: React.FC = () => {
    const { connected, connect, disconnect, select, publicKey } = useWallet();

    const handleConnect = useCallback(async () => {
        try {
            // Use the exported PhantomWalletName rather than a string literal
            select(PhantomWalletName);
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

    return (
        <div className="connect-wallet">
            {connected && publicKey ? (
                <div className="wallet-connected">
                    <p>Wallet: {publicKey.toBase58()}</p>
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
