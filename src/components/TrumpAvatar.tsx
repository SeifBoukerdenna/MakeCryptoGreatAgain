import React from 'react';
import trumpImage from '../assets/trump-memoji.jpg';

const TrumpAvatar: React.FC = () => {
    return (
        <div className="trump-avatar-container">
            <img src={trumpImage} alt="Donald Trump Cartoon" className="trump-avatar" />
        </div>
    );
};

export default TrumpAvatar;
