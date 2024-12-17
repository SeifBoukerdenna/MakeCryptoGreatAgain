// /src/components/CharacterCard.tsx

import React from 'react';

interface CharacterCardProps {
    id: string; // Add id prop
    name: string;
    avatar: string;
    description: string;
    onSelect: () => void;
    isSelected: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
    id, // Destructure id
    name,
    avatar,
    description,
    onSelect,
    isSelected,
}) => {
    return (
        <div
            className={`character-card ${isSelected ? 'selected-card' : ''}`}
            aria-disabled={isSelected}
        >
            <img src={avatar} alt={`${name} Avatar`} className="avatar" />
            <div className="character-details">
                <div className="character-name">{name}</div>
                <div className="character-description">{description}</div>
            </div>
            <button
                className="select-button"
                onClick={onSelect}
                disabled={isSelected}
                aria-disabled={isSelected}
            >
                {isSelected ? 'Selected' : 'Select'}
            </button>
        </div>
    );
};

export default CharacterCard;
