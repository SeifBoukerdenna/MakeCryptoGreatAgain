import './styles/global.css';
import Home from './pages/Home';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Default RPC endpoint (you can use a mainnet, devnet, testnet, or local RPC URL)
// const endpoint = 'https://api.mainnet-beta.solana.com';
const endpoint = 'https://api.devnet.solana.com'
// const endpoint = 'https://api.testnet.solana.com'

// Choose your wallets (Phantom in this example)
const wallets = [
  new PhantomWalletAdapter(),
  // you can add more wallets here
];


const App = () => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Home />;
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
};

export default App;
