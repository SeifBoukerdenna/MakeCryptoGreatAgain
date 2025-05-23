import { useWallet } from '@solana/wallet-adapter-react';
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
    canSelect: boolean;
    overrideWalletCheck?: boolean; // New prop to override wallet check
}

const CharacterCard = ({
    id,
    name,
    avatar,
    description,
    description_secondary,
    price,
    onSelect,
    isSelected,
    canSelect = true,
    overrideWalletCheck = false, // Default to false
}: CharacterCardProps) => {
    const { connected } = useWallet();
    const { mcgaBalance } = useBalanceStore();
    const mode = useModeStore((state) => state.modes[id] || 'normal');
    const toggleMode = useModeStore((state) => state.toggleMode);
    const { languages, allowedLanguages, setLanguage } = useLanguageStore();
    const characterLanguage = languages[id] || 'english';
    const characterAllowedLanguages = allowedLanguages[id] || ['english'];

    const switchColors = {
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

    // Character is available if wallet is connected with sufficient balance OR if overrideWalletCheck is true
    const isAvailable = overrideWalletCheck || (connected && mcgaBalance !== null && mcgaBalance >= price);

    return (
        <div
            className={`character-card ${isSelected ? 'selected-card' : ''} ${!isAvailable && !isSelected ? 'unavailable' : ''}`}
            aria-disabled={isSelected || !isAvailable}
        >
            <img
                src={avatar}
                alt={`${name} Avatar`}
                className={isSelected ? 'isSelected-avatar' : 'avatar'}
            />
            <div className="character-details">
                <div className="character-name">{name}</div>
                <div className="character-description">
                    {mode === 'normal' ? description : description_secondary}
                </div>

                {characterAllowedLanguages.length > 1 && (
                    <div className="language-dropdown">
                        <select
                            value={characterLanguage}
                            onChange={(e) => setLanguage(id, e.target.value as Language)}
                            className="dropdown"
                        >
                            {characterAllowedLanguages.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center" style={{ marginTop: '1rem' }}>
                    <Switch
                        onChange={() => toggleMode(id)}
                        checked={mode === 'secret'}
                        {...switchColors}
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
                    />
                </div>

                {!overrideWalletCheck && connected && (
                    <div className={`character-price ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                        {formatToK(price)} MCGA
                    </div>
                )}
            </div>

            <button
                className={`
          ${isSelected ? 'selected-select-button' : 'select-button'}
          ${!isAvailable && !isSelected ? 'unavailable-button' : ''}
        `}
                onClick={onSelect}
                disabled={isSelected || (!isAvailable && !overrideWalletCheck) || !canSelect}
            >
                {isSelected
                    ? 'Selected'
                    : !connected && !overrideWalletCheck
                        ? 'Connect Wallet'
                        : !isAvailable && !overrideWalletCheck
                            ? 'Insufficient MCGA'
                            : 'Select'}
            </button>
        </div>
    );
};

export default CharacterCard;