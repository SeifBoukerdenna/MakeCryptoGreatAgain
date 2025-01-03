import { Check, Coins, Copy, User } from "lucide-react";
import { truncateAddress } from "../utils/adress";
import { CharacterConfig } from "../configs/characters.config";
import { CharacterStatus } from "../hooks/useChallengeLogic";

interface WinnersSectionProps {
    charactersConfig: CharacterConfig[];
    characterStatuses: Record<string, CharacterStatus>;
    copiedStates: Record<string, boolean>;
    handleCopy: (address: string) => void;
}
const WinnersSection = ({ charactersConfig, characterStatuses, copiedStates, handleCopy }: WinnersSectionProps) => {
    return (
        <div className="winner-section">
            <h2>Challenge Winners</h2>
            <div className="winner-grid">
                {charactersConfig.map((character) => {
                    const status = characterStatuses[character.id];
                    const isSolved = status?.is_solved;

                    return (
                        <div key={character.id} className="winner-card-challenge">
                            <div>
                                <img
                                    src={character.avatar}
                                    alt={character.name}
                                    className="winner-avatar"
                                />
                                <h3 className="winner-name">{character.name}</h3>
                            </div>

                            {isSolved ? (
                                <div className="winner-info">
                                    <div className="winner-address">
                                        <button
                                            onClick={() => handleCopy(status.solved_by || '')}
                                            className="copy-address-button"
                                            title="Click to copy wallet address"
                                        >
                                            <span>{truncateAddress(status.solved_by || '')}</span>
                                            {copiedStates[status.solved_by || ''] ? (
                                                <Check className="copy-icon" size={16} />
                                            ) : (
                                                <Copy className="copy-icon" size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <div className="winner-amount">
                                        <Coins className="h-4 w-4" />
                                        {status.tokens_won > 0
                                            ? `${status.tokens_won.toLocaleString()} MCGA`
                                            : 'N/A'
                                        }
                                    </div>
                                </div>
                            ) : (
                                <div className="no-winner-info">
                                    <div className="no-winner-address">
                                        <User className="h-4 w-4" />
                                        No Winner Yet
                                    </div>
                                    <div className="no-winner-amount">
                                        <Coins className="h-4 w-4" />
                                        N/A
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WinnersSection;