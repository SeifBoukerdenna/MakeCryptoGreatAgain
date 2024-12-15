import React from 'react';
import trumpImage from '../assets/musk-memoji.png';

const MuskAvatar: React.FC = () => {
    return (
        <div className="musk-avatar-container">
            <img src={trumpImage} alt="Elon Musk Cartoon" className="musk-avatar" />
        </div>
    );
};

export default MuskAvatar;