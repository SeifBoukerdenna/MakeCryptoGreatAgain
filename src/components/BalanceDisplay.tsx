// src/components/BalanceDisplay.tsx

import React from 'react';
import { CircleDollarSign, Coins } from 'lucide-react';
import Tooltip from './Tooltip';

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
                <Tooltip message={mcgaBalance.toLocaleString()}>
                    <div className="balance-item mcga">
                        <Coins className="h-5 w-5 text-emerald-400" />
                        <div>
                            <span className="balance-amount text-emerald-200">
                                {formatToK(mcgaBalance)}
                            </span>
                            <span className="balance-symbol text-emerald-300">MCGA</span>
                        </div>
                    </div>
                </Tooltip>
            )}
        </div>
    );
};

export default BalanceDisplay;
