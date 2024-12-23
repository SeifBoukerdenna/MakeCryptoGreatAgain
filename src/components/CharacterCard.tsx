// src/components/CharacterCard.tsx

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TEST_MODE, FREE_CHARACTER_ID } from '../configs/test.config';
import useBalanceStore from '../hooks/useBalanceStore';
import { formatToK } from '../utils/numberFormat';
import Switch from 'react-switch';
import { Eye, Lock } from 'lucide-react';
import useModeStore from '../stores/useModeStore';

import useLanguageStore, { Language } from '../stores/useLanguageStore';
import { CharacterConfig } from '../configs/characters.config';

interface CharacterCardProps extends Partial<CharacterConfig> {
    id: string;
    price: number;
    onSelect: () => void;
    isSelected: boolean;
}

interface SwitchColors {
    offColor: string;
    onColor: string;
    offHandleColor: string;
    onHandleColor: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
    id,
    name,
    avatar,
    description,
    description_secondary,
    price,
    onSelect,
    isSelected,
}) => {
    const { connected } = useWallet();
    const { mcgaBalance } = useBalanceStore();

    // Grab the current mode & toggler from Zustand
    const mode = useModeStore((state) => state.modes[id] || 'normal');
    const toggleMode = useModeStore((state) => state.toggleMode);

    // Grab language & allowedLanguages from Zustand
    const { languages, allowedLanguages, setLanguage } = useLanguageStore();

    // Figure out which language this character is currently set to
    const characterLanguage = languages[id] || 'english';

    // If we haven't explicitly listed the character in allowedLanguages,
    // just default them to a single choice: ['english']
    const characterAllowedLanguages = allowedLanguages[id] || ['english'];

    // Switch colors from CSS variables
    const switchColors: SwitchColors = {
        offColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-bg-light')
            .trim() || '#888888',
        onColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-bg-dark')
            .trim() || '#6366F1',
        offHandleColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-handle-light')
            .trim() || '#ffffff',
        onHandleColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-handle-dark')
            .trim() || '#ffffff',
    };

    const isAvailable =
        (TEST_MODE && id === FREE_CHARACTER_ID) ||
        (connected && mcgaBalance !== null && mcgaBalance >= price);

    const showPrice = connected && (!TEST_MODE || id !== FREE_CHARACTER_ID);

    return (
        <div
            key={id}
            className={`character-card ${isSelected ? 'selected-card' : ''
                } ${!isAvailable && !isSelected ? 'unavailable' : ''}`}
            aria-disabled={isSelected || !isAvailable}
        >
            <img
                src={avatar}
                alt={`${name} Avatar`}
                className={isSelected ? 'isSelected-avatar' : 'avatar'}
            />
            <div className="character-details">
                <div className="character-name">{name}</div>

                {/* Normal or secondary description based on mode */}
                <div className="character-description">
                    {mode === 'normal' ? description : description_secondary}
                </div>

                {/* Language Dropdown */}
                <div className="language-dropdown">
                    <select
                        id={`language-selector-${id}`}
                        value={characterLanguage}
                        onChange={(e) =>
                            setLanguage(id, e.target.value as Language)
                        }
                        className="dropdown"
                    >
                        {characterAllowedLanguages.map((lang) => (
                            <option key={lang} value={lang}>
                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mode Toggle Switch */}
                <div className="flex items-center" style={{ marginTop: '1rem' }}>
                    <Switch
                        onChange={() => toggleMode(id)}
                        checked={mode === 'secret'}
                        offColor={switchColors.offColor}
                        onColor={switchColors.onColor}
                        offHandleColor={switchColors.offHandleColor}
                        onHandleColor={switchColors.onHandleColor}
                        uncheckedIcon={
                            <Eye
                                size={12}
                                color="#6B7280"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    width: '100%',
                                    padding: '2px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        }
                        checkedIcon={
                            <Lock
                                size={12}
                                color="#6B7280"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    width: '100%',
                                    padding: '2px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        }
                        height={24}
                        width={48}
                        handleDiameter={20}
                        aria-label={`Switch to ${mode === 'normal' ? 'secret' : 'normal'
                            } mode`}
                        className="react-switch"
                    />
                </div>

                {showPrice && (
                    <div
                        className={`character-price ${isAvailable ? 'text-green-500' : 'text-red-500'
                            }`}
                    >
                        {formatToK(price)} MCGA
                    </div>
                )}
                {TEST_MODE && id === FREE_CHARACTER_ID && (
                    <div className="text-xs text-purple-500 mt-1">
                        Free in Test Mode
                    </div>
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
                            : 'Select'}
            </button>
        </div>
    );
};

export default CharacterCard;
