// src/components/Layout.tsx

import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import ThemeToggle from './ThemeToggle';
import ConnectWallet from './ConnectWallet';
import useBalanceStore from '../hooks/useBalanceStore';

interface LayoutProps {
    toggleTheme: () => void;
    theme: 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ toggleTheme, theme }) => {
    const { connected, publicKey } = useWallet();
    const { connection } = useConnection();
    const { balance, setBalance } = useBalanceStore();

    useEffect(() => {
        const fetchBalance = async () => {
            if (connected && publicKey) {
                try {
                    const balance = await connection.getBalance(publicKey);
                    setBalance(balance / 1e9); // Convert lamports to SOL
                } catch (error) {
                    console.error('Error fetching balance:', error);
                    setBalance(null);
                }
            } else {
                setBalance(null);
            }
        };

        fetchBalance();
        const intervalId = setInterval(fetchBalance, 30000);
        return () => clearInterval(intervalId);
    }, [connected, publicKey, connection, setBalance]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <nav className="navbar flex justify-between items-center">
                <div className="logo">
                    <h1 className="text-2xl font-bold">Make Crypto Great Again</h1>
                </div>

                <div className="flex items-center gap-8">
                    {connected && balance !== null && (
                        <div className="text-base font-medium px-4 py-2 rounded-lg bg-opacity-20 bg-purple-500 text-purple-200">
                            {balance.toFixed(4)} SOL
                        </div>
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