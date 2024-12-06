import React, { useState } from 'react';

interface BuyTrumpTalkCoinProps {
    walletAddress: string | null;
}

const BuyTrumpTalkCoin: React.FC<BuyTrumpTalkCoinProps> = ({ walletAddress }) => {
    const [amount, setAmount] = useState<number>(0);

    const handleBuy = () => {
        if (!walletAddress) {
            alert('Please connect your Solana wallet first!');
            return;
        }
        // Simulate a buy action
        console.log(`Buying ${amount} TrumpTalkCoin for ${walletAddress}`);
        alert(`Successfully purchased ${amount} TrumpTalkCoin!`);
    };

    return (
        <div className="buy-coin-card">
            <h2>Buy TrumpTalkCoin</h2>
            {walletAddress ? (
                <>
                    <input
                        type="number"
                        className="coin-input"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        placeholder="Amount"
                    />
                    <button className="buy-button" onClick={handleBuy}>
                        Buy
                    </button>
                </>
            ) : (
                <p className="connect-reminder">Connect your wallet to buy coins</p>
            )}
        </div>
    );
};

export default BuyTrumpTalkCoin;
