// src/App.tsx

import React, { useState, useEffect } from 'react';
import './styles/global.css';
import Home from './pages/Home';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Default RPC endpoint (you can use a mainnet, devnet, testnet, or local RPC URL)
const endpoint = 'https://api.devnet.solana.com';

// Choose your wallets (Phantom in this example)
const wallets = [
  new PhantomWalletAdapter(),
  // You can add more wallets here
];

const App = () => {
  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // On component mount, check localStorage for theme preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      // Default to dark theme
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle theme and persist preference
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Pass toggleTheme and theme to Home via props */}
          <Home toggleTheme={toggleTheme} theme={theme} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
