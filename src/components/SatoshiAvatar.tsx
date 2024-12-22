import React from 'react';
import jonesImage from '../assets/satoshi-memoji.png';

const SatoshiAvatar: React.FC = () => {
    return (
        <div className="satoshi-avatar-container">
            <img src={jonesImage} alt="Satoshi Nakamoto Cartoon" className="satoshi-avatar" />
        </div>
    );
};

export default SatoshiAvatar;
