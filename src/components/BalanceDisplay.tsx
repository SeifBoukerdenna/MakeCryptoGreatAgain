import React from 'react';
import { CircleDollarSign, Coins, ExternalLink } from 'lucide-react';
import Tooltip from './Tooltip';
import { MCGA_TOKEN_MINT } from '../constants/tokens';
import { NETWORK } from '../configs/test.config';

interface BalanceDisplayProps {
    solBalance: number | null;
    mcgaBalance: number | null;
    formatToK: (num: number) => string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
    solBalance,
    mcgaBalance,
    formatToK,
}) => {
    const handleMcgaClick = () => {
        window.open(`https://solscan.io/token/${MCGA_TOKEN_MINT.toString()}?cluster=${NETWORK}`, '_blank');
    };

    return (
        <div className='balances'>
            {solBalance !== null && (
                <Tooltip message={solBalance.toLocaleString()}>
                    <div className="balance-item sol">
                        <CircleDollarSign className="h-5 w-5 text-violet-400" />
                        <div className="flex">
                            <span className="balance-amount text-violet-200">
                                {formatToK(solBalance)}
                            </span>
                            <span className="balance-symbol text-violet-300">SOL</span>
                        </div>
                    </div>
                </Tooltip>
            )}
            {mcgaBalance !== null && (
                <Tooltip message={`View MCGA token on Solscan (${mcgaBalance.toLocaleString()} MCGA)`}>
                    <div
                        className="balance-item mcga cursor-pointer hover:scale-105 transform transition-all duration-200 group flex items-center gap-2 relative hover:shadow-lg"
                        onClick={handleMcgaClick}
                    >
                        <Coins className="h-5 w-5 text-emerald-400 group-hover:animate-pulse" />
                        <div className="flex items-center gap-1">
                            <span className="balance-amount text-emerald-200 group-hover:text-emerald-100">
                                {formatToK(mcgaBalance)}
                            </span>
                            <span className="balance-symbol text-emerald-300">MCGA</span>
                            <ExternalLink className="h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </div>
                </Tooltip>
            )}
        </div>
    );
};

export default BalanceDisplay;