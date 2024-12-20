// src/components/Layout.tsx

import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import ThemeToggle from './ThemeToggle';
import ConnectWallet from './ConnectWallet';
import { MCGA_TOKEN_MINT } from '../constants/tokens';
import { formatToK } from '../utils/numberFormat';
import BalanceDisplay from './BalanceDisplay';
import useBalanceStore from '../hooks/useBalanceStore';

interface LayoutProps {
    toggleTheme: () => void;
    theme: 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ toggleTheme, theme }) => {
    const { connected, publicKey } = useWallet();
    const { connection } = useConnection();
    const { solBalance, mcgaBalance, setSolBalance, setMcgaBalance } = useBalanceStore();

    useEffect(() => {
        const fetchBalances = async () => {
            if (connected && publicKey) {
                try {
                    // Fetch SOL balance
                    const solBalance = await connection.getBalance(publicKey);
                    setSolBalance(solBalance / 1e9);

                    // Fetch MCGA token balance
                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                        publicKey,
                        { mint: MCGA_TOKEN_MINT }
                    );

                    // Find MCGA token account
                    const mcgaAccount = tokenAccounts.value[0];
                    if (mcgaAccount) {
                        const tokenAmount = mcgaAccount.account.data.parsed.info.tokenAmount;
                        const mcgaBalance = parseInt(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
                        setMcgaBalance(mcgaBalance);
                    } else {
                        setMcgaBalance(0);
                    }
                } catch (error) {
                    console.error('Error fetching balances:', error);
                    setSolBalance(null);
                    setMcgaBalance(null);
                }
            } else {
                setSolBalance(null);
                setMcgaBalance(null);
            }
        };

        fetchBalances();
        const intervalId = setInterval(fetchBalances, 30000);
        return () => clearInterval(intervalId);
    }, [connected, publicKey, connection, setSolBalance, setMcgaBalance]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <nav className="navbar flex justify-between items-center">
                <div className="logo">
                    <h1 className="text-2xl font-bold">Make Crypto Great Again</h1>
                </div>

                <div className="flex items-center gap-8">
                    {connected && (
                        <BalanceDisplay
                            solBalance={solBalance}
                            mcgaBalance={mcgaBalance}
                            formatToK={formatToK}
                        />
                    )}

                    <div className="navigation-links flex space-x-8">
                        <NavLink
                            to="/"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to="/about"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                            About
                        </NavLink>
                    </div>
                </div>

                <div className="action-buttons-column">
                    <ThemeToggle toggleTheme={toggleTheme} theme={theme} />
                    <ConnectWallet />
                </div>
            </nav>

            <main className="flex-1 px-4 py-6 md:px-8 bg-gray-50 dark:bg-gray-900">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;