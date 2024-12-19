// src/components/Layout.tsx

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import ConnectWallet from './ConnectWallet';

interface LayoutProps {
    toggleTheme: () => void;
    theme: 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ toggleTheme, theme }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Top Navbar */}
            <nav className="navbar flex justify-between items-center">
                {/* Logo */}
                <div className="logo">
                    <h1 className="text-2xl font-bold">Make Crypto Great Again</h1>
                </div>

                {/* Navigation Links */}
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

                {/* Action Buttons */}
                <div className="action-buttons-column">
                    <ThemeToggle toggleTheme={toggleTheme} theme={theme} />
                    <ConnectWallet />
                </div>

            </nav>

            {/* Main Content */}
            <main className="flex-1 px-4 py-6 md:px-8 bg-gray-50 dark:bg-gray-900">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
