import { Timer } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMcgaBalance } from '../hooks/useMcgaBalance';
import "../styles/challenge.css"
const CooldownExplainer = () => {
    const { connected } = useWallet();
    const mcgaBalance = useMcgaBalance();

    const BASE_COOLDOWN_MS = 120000; // 2 minutes
    const MIN_COOLDOWN_MS = 1000; // 1 second
    const TOKEN_DENOMINATOR = 1000; // Every 1000 tokens
    const REDUCTION_PER_TOKEN_GROUP = 10000; // 10 seconds per 1000 tokens

    const calculateCooldown = () => {
        const tokenGroups = Math.floor(mcgaBalance / TOKEN_DENOMINATOR);
        const reduction = tokenGroups * REDUCTION_PER_TOKEN_GROUP;
        return Math.max(BASE_COOLDOWN_MS - reduction, MIN_COOLDOWN_MS);
    };

    // Calculate reduction percentage (0-100)
    const getReductionPercentage = () => {
        const maxReduction = BASE_COOLDOWN_MS - MIN_COOLDOWN_MS;
        const actualReduction = Math.min(
            Math.floor(mcgaBalance / TOKEN_DENOMINATOR) * REDUCTION_PER_TOKEN_GROUP,
            maxReduction
        );
        return (actualReduction / maxReduction) * 100;
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
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
                    Hold MCGA tokens to reduce cooldown from 2m to 1s
                </div>
            </div>
        </div>
    );
};

export default CooldownExplainer;