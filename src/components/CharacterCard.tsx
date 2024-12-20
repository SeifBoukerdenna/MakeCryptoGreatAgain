// src/components/CharacterCard.tsx

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TEST_MODE, FREE_CHARACTER_ID } from '../configs/test.config';
import useBalanceStore from '../hooks/useBalanceStore';
import { formatToK } from '../utils/numberFormat';

interface CharacterCardProps {
    id: string;
    name: string;
    avatar: string;
    description: string;
    price: number;
    onSelect: () => void;
    isSelected: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
    id,
    name,
    avatar,
    description,
    price,
    onSelect,
    isSelected,
}) => {
    const { connected } = useWallet();
    const { mcgaBalance } = useBalanceStore();

    const isAvailable =
        (TEST_MODE && id === FREE_CHARACTER_ID) ||
        (connected && mcgaBalance !== null && mcgaBalance >= price);

    const showPrice = connected && (!TEST_MODE || id !== FREE_CHARACTER_ID);

    return (
        <div
            key={id}
            className={`character-card ${isSelected ? 'selected-card' : ''} ${!isAvailable && !isSelected ? 'unavailable' : ''
                }`}
            aria-disabled={isSelected || !isAvailable}
        >
            <img
                src={avatar}
                alt={`${name} Avatar`}
                className={isSelected ? 'isSelected-avatar' : 'avatar'}
            />
            <div className="character-details">
                <div className="character-name">{name}</div>
                <div className="character-description">{description}</div>
                {showPrice && (
                    <div className={`character-price ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                        {formatToK(price)} MCGA
                    </div>
                )}
                {TEST_MODE && id === FREE_CHARACTER_ID && (
                    <div className="text-xs text-purple-500 mt-1">Free in Test Mode</div>
                )}
            </div>
            <button
                className={`
          ${isSelected ? 'selected-select-button' : 'select-button'}
          ${!isAvailable && !isSelected ? 'unavailable-button' : ''}
        `}
                onClick={onSelect}
                disabled={isSelected || !isAvailable}
                aria-disabled={isSelected || !isAvailable}
            >
                {isSelected
                    ? 'Selected'
                    : !connected && !(TEST_MODE && id === FREE_CHARACTER_ID)
                        ? 'Connect Wallet'
                        : !isAvailable
                            ? 'Insufficient MCGA'
                            : 'Select'
                }
            </button>
        </div>
    );
};

export default CharacterCard;