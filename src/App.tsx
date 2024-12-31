// src/App.tsx

import { useState } from 'react';
import './styles/global.css';
import Home from './pages/Home';
import About from './pages/About';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { TEST_MODE } from './configs/test.config';
import Layout from './components/Layout';
import Social from './pages/Social';
import RoadmapPage from './pages/RoadMap';
import AdminCharacters from './pages/Admin';
import ChallengePage from './pages/Challenge';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Buffer as BufferPolyfill } from 'buffer';

declare var Buffer: typeof BufferPolyfill;
globalThis.Buffer = BufferPolyfill;

const endpoint = 'https://api.devnet.solana.com';
const wallets = [new PhantomWalletAdapter()];

const App = () => {
  injectSpeedInsights();

  // Initialize theme synchronously
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
      return storedTheme;
    } else {
      document.documentElement.classList.add('dark');
      return 'dark';
    }
  });

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
          <Router>
            <Routes>
              <Route path="/" element={<Layout toggleTheme={toggleTheme} theme={theme} />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About theme={theme} />} />
                <Route path="social" element={<Social />} />
                <Route path="/challenge" element={<ChallengePage />} />
                <Route path="roadmap" element={<RoadmapPage />} />
                {TEST_MODE && <Route path="/admin" element={<AdminCharacters />} />}
              </Route>
            </Routes>
          </Router>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
