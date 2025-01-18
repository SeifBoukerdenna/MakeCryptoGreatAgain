import { Timer } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMcgaBalance } from '../hooks/useMcgaBalance';
import "../styles/challenge.css"

const CooldownExplainer = () => {
    const { connected } = useWallet();
    const mcgaBalance = useMcgaBalance();

    const BASE_COOLDOWN_MS = 21600000; // 6 hours (21,600,000 ms)
    const MAX_TOKEN_AMOUNT = 1000000; // 1M tokens for minimum cooldown
    const MIN_COOLDOWN_MS = 1000; // Minimum 1 second cooldown

    const calculateCooldown = () => {
        // Cap the balance at MAX_TOKEN_AMOUNT
        const effectiveBalance = Math.min(mcgaBalance, MAX_TOKEN_AMOUNT);

        // Calculate percentage of max tokens held (0 to 1)
        const percentageOfMaxTokens = effectiveBalance / MAX_TOKEN_AMOUNT;

        // Linear interpolation between BASE_COOLDOWN_MS and MIN_COOLDOWN_MS
        const cooldown = BASE_COOLDOWN_MS - (percentageOfMaxTokens * (BASE_COOLDOWN_MS - MIN_COOLDOWN_MS));

        return Math.max(Math.floor(cooldown), MIN_COOLDOWN_MS);
    };

    // Calculate reduction percentage (0-100)
    const getReductionPercentage = () => {
        const effectiveBalance = Math.min(mcgaBalance, MAX_TOKEN_AMOUNT);
        return (effectiveBalance / MAX_TOKEN_AMOUNT) * 100;
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);

        if (totalSeconds < 60) {
            return `${totalSeconds} seconds`;
        }

        if (totalSeconds < 3600) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}m ${seconds}s`;
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (minutes === 0 && seconds === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <div className="stat-card">
            <Timer className="stat-icon" />
            <div className="stat-content">
                <div className="stat-label">Challenge Cooldown</div>
                <div className="stat-value">
                    {connected ? formatTime(calculateCooldown()) : formatTime(BASE_COOLDOWN_MS)}
                </div>
                <div className="power-info">
                    Based on {mcgaBalance.toLocaleString()} MCGA
                </div>
                <div className="power-progress">
                    <div
                        className="power-bar"
                        style={{
                            width: `${connected ? getReductionPercentage() : 0}%`
                        }}
                    />
                </div>
                <div className="power-tips">
                    Hold MCGA tokens to reduce cooldown from 6h to 1s
                </div>
                <div className="power-tips">
                    Hold 100k MCGA to reduce cooldown to 1s
                </div>
            </div>
        </div>
    );
};

export default CooldownExplainer;